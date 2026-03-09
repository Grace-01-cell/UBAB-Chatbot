from argostranslate import translate


def translate_text(text: str, from_code: str, to_code: str) -> str:
    """
    Translate text using Argos Translate.
    If translation fails for any reason, return the original text.
    """
    try:
        return translate.translate(text, from_code, to_code)
    except Exception:
        return text


def sw_to_en(text: str) -> str:
    return translate_text(text, "sw", "en")


def en_to_sw(text: str) -> str:
    return translate_text(text, "en", "sw")