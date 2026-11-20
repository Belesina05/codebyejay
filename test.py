"""
Telegram phone verification bot (mobile number -> OTP).

Verifies that the user owns the number they enter, using Twilio Verify
(a service you control). Replace `on_verified()` with your own logic.

Setup:
    pip install "python-telegram-bot>=20.7" httpx

Environment variables:
    BOT_TOKEN                   token from @BotFather (for @testej_dbot)
    TWILIO_ACCOUNT_SID
    TWILIO_AUTH_TOKEN
    TWILIO_VERIFY_SERVICE_SID   Verify service SID (starts with VA...)

Run:
    python verify_bot.py
"""

import logging
import os
import re
import time
from collections import defaultdict

import httpx
from telegram import ReplyKeyboardRemove, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s", level=logging.INFO
)
log = logging.getLogger("verify_bot")

BOT_TOKEN = os.environ["BOT_TOKEN"]
TWILIO_SID = os.environ["TWILIO_ACCOUNT_SID"]
TWILIO_TOKEN = os.environ["TWILIO_AUTH_TOKEN"]
VERIFY_SID = os.environ["TWILIO_VERIFY_SERVICE_SID"]

VERIFY_URL = f"https://verify.twilio.com/v2/Services/{VERIFY_SID}"

ASK_PHONE, ASK_OTP = range(2)

# --- simple in-memory rate limits (use Redis/DB in production) ---
MAX_SENDS_PER_HOUR = 3
MAX_CODE_ATTEMPTS = 5
_send_log: dict[int, list[float]] = defaultdict(list)


def normalize_ph_number(raw: str) -> str | None:
    """Accepts 09XXXXXXXXX, 9XXXXXXXXX, 639XXXXXXXXX, +639XXXXXXXXX -> +639XXXXXXXXX."""
    digits = re.sub(r"[^\d+]", "", raw.strip())
    digits = digits.lstrip("+")
    if digits.startswith("09") and len(digits) == 11:
        digits = "63" + digits[1:]
    elif digits.startswith("9") and len(digits) == 10:
        digits = "63" + digits
    if re.fullmatch(r"639\d{9}", digits):
        return "+" + digits
    return None


def allowed_to_send(user_id: int) -> bool:
    now = time.time()
    _send_log[user_id] = [t for t in _send_log[user_id] if now - t < 3600]
    if len(_send_log[user_id]) >= MAX_SENDS_PER_HOUR:
        return False
    _send_log[user_id].append(now)
    return True


async def twilio_post(path: str, data: dict) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{VERIFY_URL}/{path}", data=data, auth=(TWILIO_SID, TWILIO_TOKEN)
        )
    try:
        body = resp.json()
    except ValueError:
        body = {}
    body["_http"] = resp.status_code
    return body


async def on_verified(user_id: int, phone: str) -> None:
    """Hook: called once the user's number is verified. Put your own logic here."""
    log.info("Verified user_id=%s phone=%s", user_id, phone)


# --- handlers ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text(
        "Send your mobile number (e.g. 09171234567 or +639171234567)."
    )
    return ASK_PHONE


async def got_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    phone = normalize_ph_number(update.message.text)
    if not phone:
        await update.message.reply_text(
            "Invalid number. Use a PH mobile number like 09171234567."
        )
        return ASK_PHONE

    user_id = update.effective_user.id
    if not allowed_to_send(user_id):
        await update.message.reply_text(
            "Too many code requests. Please try again in an hour."
        )
        return ConversationHandler.END

    result = await twilio_post("Verifications", {"To": phone, "Channel": "sms"})
    if result["_http"] not in (200, 201):
        log.warning("Twilio send failed: %s", result)
        await update.message.reply_text(
            "Couldn't send the code. Check the number and try again with /start."
        )
        return ConversationHandler.END

    context.user_data["phone"] = phone
    context.user_data["attempts"] = 0
    await update.message.reply_text(f"Code sent to {phone}. Enter the OTP.")
    return ASK_OTP


async def got_otp(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    code = re.sub(r"\D", "", update.message.text)
    if not 4 <= len(code) <= 8:
        await update.message.reply_text("Enter the numeric code you received.")
        return ASK_OTP

    context.user_data["attempts"] += 1
    phone = context.user_data["phone"]
    result = await twilio_post("VerificationCheck", {"To": phone, "Code": code})

    if result.get("status") == "approved":
        await on_verified(update.effective_user.id, phone)
        await update.message.reply_text("Verified ✅")
        context.user_data.clear()
        return ConversationHandler.END

    if context.user_data["attempts"] >= MAX_CODE_ATTEMPTS:
        await update.message.reply_text("Too many wrong attempts. Send /start to retry.")
        context.user_data.clear()
        return ConversationHandler.END

    await update.message.reply_text("Wrong code. Try again.")
    return ASK_OTP


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text("Cancelled.", reply_markup=ReplyKeyboardRemove())
    return ConversationHandler.END


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()
    conv = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            ASK_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_phone)],
            ASK_OTP: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_otp)],
        },
        fallbacks=[CommandHandler("cancel", cancel), CommandHandler("start", start)],
    )
    app.add_handler(conv)
    log.info("Bot running...")
    app.run_polling()


if __name__ == "__main__":
    main()