"""
نظام إدارة القضايا الاحترافي - النسخة v9.0 (نسخة محسنة مع Sidebar + تقويم + كشف تكرار)
======================================================
المطور: مساعدك الذكي للأستاذ سايج محمد
التحسينات:
  1. حفظ الإعدادات ومسار القضايا بشكل دائم في مجلد المستخدم (لا تحذف بعد إغلاق الـ exe).
  2. توسيط إجباري لديباجة المحامي في تقارير الـ PDF والـ HTML.
  3. زر الأرشفة يعمل في الاتجاهين (أرشفة / استعادة من الأرشيف).
  4. توافقية كاملة مع جميع إصدارات بايثون لتفادي توقف التطبيق.
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import os
import subprocess
import webbrowser
import shutil
import urllib.parse
import json
import logging
import sys
import platform
import csv
from datetime import datetime, date
import calendar as cal_module
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Tuple, Any
from pathlib import Path

# ──────────────────────────────────────────────
# إعداد مسار حفظ الإعدادات الدائم (USER_HOME)
# ──────────────────────────────────────────────
USER_HOME = str(Path.home())
APP_DATA_DIR = os.path.join(USER_HOME, "CaseManagerData")
if not os.path.exists(APP_DATA_DIR):
    try:
        os.makedirs(APP_DATA_DIR, exist_ok=True)
    except Exception:
        APP_DATA_DIR = os.path.dirname(os.path.abspath(sys.argv[0]))

LOG_DIR = APP_DATA_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "case_manager.log"), encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# التحقق من المكتبات الاختيارية
# ──────────────────────────────────────────────
try:
    from tkcalendar import DateEntry
    TKCALENDAR_AVAILABLE = True
except ImportError:
    TKCALENDAR_AVAILABLE = False
    DateEntry = None

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    PDF_ARABIC_AVAILABLE = True
except ImportError:
    PDF_ARABIC_AVAILABLE = False

try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

# ──────────────────────────────────────────────
# الثوابت المركزية (Constants)
# ──────────────────────────────────────────────
class AppConstants:
    APP_VERSION = "v9.0"
    APP_TITLE = f"نظام إدارة القضايا {APP_VERSION}"
    APP_GEOMETRY = "1280x920"
    APP_MIN_SIZE = (960, 720)

    SETTINGS_FILE = os.path.join(APP_DATA_DIR, "app_settings.json")
    CASE_INFO_FILE = "00_INFO.txt"

    URGENT_DAYS_THRESHOLD = 3
    
    DEFAULT_LAWYER_NAME = "الأستاذ(ة): ........................"
    DEFAULT_LAWYER_TITLE = "محام لدى ........................"
    DEFAULT_LAWYER_ADDRESS = "العنوان: ........................"
    DEFAULT_LAWYER_PHONE = "........................"
    
    DEFAULT_COUNTRY_CODE = "213"
    AUTOSAVE_INTERVAL_MS = 60_000

    FONT_FAMILY = "Segoe UI" if platform.system() == "Windows" else "Tahoma"
    FONT_SIZE_SMALL = 10
    FONT_SIZE_NORMAL = 11
    FONT_SIZE_MEDIUM = 12
    FONT_SIZE_LARGE = 15
    FONT_SIZE_XLARGE = 20
    FONT_SIZE_TITLE = 24

    CASE_STATUSES = ["جارية", "للجدولة", "مفصول فيها", "مؤرشفة"]

    ROLES = [
        "مدعي", "مدعى عليه", "مشتكي", "مشتكى منه", "ضحية",
        "طرف مدني", "مدخل في الخصام", "متهم", "مستأنف",
        "مستأنف عليه", "معارض", "معارض ضده"
    ]

    STAGES = [
        "افتتاحية (ابتدائي)", "استئنافية", "معارضة",
        "استدعاء مباشر", "تحقيق", "معارضة مع إدخال رقم القضية محل البراءة", "أخرى",
    ]

    STAGES_NEEDING_ORIG_CASE = {"استئنافية", "معارضة", "معارضة مع إدخال رقم القضية محل البراءة"}
    STAGE_NEEDING_CUSTOM = "أخرى"

    CASE_NATURES = [
        "جنحة", "مخالفة", "جناية", "أحداث", "تحقيق / غرفة الاتهام",
        "مدني", "عقاري", "شؤون الأسرة", "عمالي", "تجاري", "بحري",
        "استعجالي", "إداري", "أمر على عريضة", "أخرى"
    ]

    COLORS = {
        "primary": "#2c3e50", "primary_light": "#34495e", "primary_accent": "#3498db",
        "secondary": "#2ecc71", "success": "#27ae60", "warning": "#f39c12",
        "danger": "#e74c3c", "info": "#2980b9", "purple": "#8e44ad",
        "bg_main": "#ecf0f1", "bg_card": "#ffffff", "bg_sidebar": "#2c3e50",
        "bg_header": "#1a252f", "bg_input": "#f8f9fa", "bg_input_focus": "#ffffff",
        "text_primary": "#2c3e50", "text_secondary": "#7f8c8d", "text_light": "#bdc3c7",
        "text_white": "#ffffff", "text_urgent": "#c0392b", "text_remaining": "#e74c3c",
        "status_active": "#27ae60", "status_scheduling": "#f39c12",
        "status_decided": "#3498db", "status_archived": "#95a5a6",
        "border_light": "#dfe6e9", "border_focus": "#3498db",
    }

    FIELD_MAP = {
        "اسم المحامي": "lawyer", "المجلس": "council", "المحكمة": "court",
        "القسم": "section", "طبيعة القضية": "nature", "رقم القضية الأصلية": "orig_case_num",
        "رقم القضية": "case_number", "الموضوع": "subject", "هاتف قاعة المحامين": "bar_phone",
        "الأتعاب": "fees", "المدفوع": "paid", "مرحلة التقاضي": "stage",
        "حالة القضية": "status", "تسجيل": "date_register", "جلسة": "first_session",
        "التاريخ": "delib_date",
    }

    KEYBINDINGS = {
        "save": "<Control-s>", "new": "<Control-n>", "search": "<Control-f>", "quit": "<Control-q>",
    }

    @staticmethod
    def adjust_color_brightness(hex_color: str, amount: int = 20) -> str:
        hex_color = hex_color.lstrip('#')
        try:
            r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            r = max(0, min(255, r + amount))
            g = max(0, min(255, g + amount))
            b = max(0, min(255, b + amount))
            return f'#{r:02x}{g:02x}{b:02x}'
        except: return f'#{hex_color}'

# ──────────────────────────────────────────────
# مساعدات المنصة
# ──────────────────────────────────────────────
class PlatformHelper:
    @staticmethod
    def get_os() -> str: return platform.system()

    @staticmethod
    def open_folder_in_explorer(folder_path: str):
        os_name = PlatformHelper.get_os()
        try:
            if os_name == "Windows": subprocess.Popen(f'explorer "{os.path.normpath(folder_path)}"')
            elif os_name == "Darwin": subprocess.Popen(["open", folder_path])
            else: subprocess.Popen(["xdg-open", folder_path])
        except OSError as e:
            logger.error(f"تعذر فتح المجلد: {e}")
            messagebox.showerror("خطأ", f"تعذر فتح المجلد:\n{e}")

    @staticmethod
    def get_mousewheel_delta(event) -> int:
        os_name = PlatformHelper.get_os()
        if os_name == "Darwin": return int(-1 * event.delta)
        elif os_name == "Windows": return int(-1 * (event.delta / 120))
        else: return -1 if event.num == 4 else 1

    @staticmethod
    def bind_mousewheel(widget, callback):
        os_name = PlatformHelper.get_os()
        if os_name == "Linux":
            widget.bind("<Button-4>", callback)
            widget.bind("<Button-5>", callback)
        else: widget.bind("<MouseWheel>", callback)

    @staticmethod
    def unbind_mousewheel(widget):
        os_name = PlatformHelper.get_os()
        if os_name == "Linux":
            try: widget.unbind("<Button-4>"); widget.unbind("<Button-5>")
            except Exception: pass
        else:
            try: widget.unbind("<MouseWheel>")
            except Exception: pass

# ──────────────────────────────────────────────
# نماذج البيانات
# ──────────────────────────────────────────────
@dataclass
class DelayEntry:
    date: str = ""; reason: str = ""

@dataclass
class PartyEntry:
    role: str = ""; name: str = ""; phone: str = ""; lawyer_name: str = ""; lawyer_phone: str = ""

@dataclass
class CaseData:
    lawyer: str = ""
    council: str = ""; court: str = ""; section: str = ""; nature: str = ""
    case_number: str = ""; subject: str = ""; bar_phone: str = ""
    stage: str = AppConstants.STAGES[0]; orig_case_num: str = ""; custom_stage: str = ""
    status: str = AppConstants.CASE_STATUSES[0]; fees: str = ""; paid: str = ""
    date_register: str = ""; first_session: str = ""; delib_date: str = ""
    notes: str = ""; judgment: str = ""
    delays: List[DelayEntry] = field(default_factory=list)
    parties: List[PartyEntry] = field(default_factory=list)

    @property
    def remaining(self) -> float:
        try:
            fees = float(self.fees) if self.fees.strip() else 0.0
            paid = float(self.paid) if self.paid.strip() else 0.0
            return fees - paid
        except ValueError:
            return 0.0

    @property
    def stage_display(self) -> str:
        if self.stage == "أخرى" and self.custom_stage.strip(): return self.custom_stage.strip()
        return self.stage

    @property
    def status_color(self) -> str:
        colors = {
            "جارية": AppConstants.COLORS["status_active"], "للجدولة": AppConstants.COLORS["status_scheduling"],
            "مفصول فيها": AppConstants.COLORS["status_decided"], "مؤرشفة": AppConstants.COLORS["status_archived"],
        }
        return colors.get(self.status, AppConstants.COLORS["text_secondary"])

    @property
    def parties_summary(self) -> str:
        if not self.parties: return "—"
        parts = []
        for p in self.parties[:4]: parts.append(f"{p.name} ({p.role})")
        summary = " | ".join(parts)
        if len(self.parties) > 4: summary += f" (+{len(self.parties) - 4})"
        return summary

    def is_valid(self) -> Tuple[bool, str]:
        if not self.case_number.strip(): return False, "يرجى إدخال رقم القضية."
        if not self.court.strip(): return False, "يرجى إدخال اسم المحكمة."
        return True, ""

# ──────────────────────────────────────────────
# طبقة الوصول للبيانات
# ──────────────────────────────────────────────
class CaseFileHandler:
    _cache: Dict[str, float] = {}
    _cached_cases: Dict[str, Optional[CaseData]] = {}

    @classmethod
    def clear_cache(cls):
        cls._cache.clear(); cls._cached_cases.clear()

    @staticmethod
    def save_case(case_data: CaseData, folder_path: str) -> str:
        try: os.makedirs(folder_path, exist_ok=True)
        except OSError as e:
            logger.error(f"خطأ في إنشاء المجلد: {e}"); raise

        file_path = os.path.join(folder_path, AppConstants.CASE_INFO_FILE)
        if os.path.exists(file_path):
            backup_path = file_path + ".bak"
            try: shutil.copy2(file_path, backup_path)
            except OSError as e: logger.warning(f"فشل النسخ الاحتياطي: {e}")

        txt = CaseFileHandler._build_txt_content(case_data)
        try:
            with open(file_path, "w", encoding="utf-8") as f: f.write(txt)
            CaseFileHandler._update_cache(file_path, case_data)
            return file_path
        except OSError as e:
            logger.error(f"خطأ في حفظ الملف: {e}"); raise

    @staticmethod
    def _build_txt_content(case_data: CaseData) -> str:
        lines = [
            f"اسم المحامي: {case_data.lawyer}", f"المجلس: {case_data.council}", f"المحكمة: {case_data.court}",
            f"القسم: {case_data.section}", f"طبيعة القضية: {case_data.nature}", f"رقم القضية: {case_data.case_number}",
            f"الموضوع: {case_data.subject}", f"هاتف قاعة المحامين: {case_data.bar_phone}",
            f"مرحلة التقاضي: {case_data.stage}", f"رقم القضية الأصلية: {case_data.orig_case_num}",
            f"مرحلة مخصصة: {case_data.custom_stage}", f"حالة القضية: {case_data.status}",
            f"الأتعاب: {case_data.fees}", f"المدفوع: {case_data.paid}", f"المتبقي: {case_data.remaining:g}", "",
            "التواريخ:", f"تسجيل: {case_data.date_register}", f"جلسة: {case_data.first_session}", f"التاريخ: {case_data.delib_date}", "",
            "التفاصيل الإضافية:", case_data.notes.strip(), "", "التأجيلات:",
        ]
        for d in case_data.delays: lines.append(f"[تأجيل] | {d.date} | {d.reason}")
        lines.append(""); lines.append("الأطراف:")
        for p in case_data.parties: lines.append(f"[{p.role}] | {p.name} | {p.phone} | {p.lawyer_name} | {p.lawyer_phone}")
        lines.append(""); lines.append("المنطوق:")
        lines.append(case_data.judgment.strip())
        return "\n".join(lines)

    @staticmethod
    def load_case(file_path: str) -> Optional[CaseData]:
        if not os.path.exists(file_path): return None
        try:
            current_mtime = os.path.getmtime(file_path)
            cached_mtime = CaseFileHandler._cache.get(file_path)
            if cached_mtime == current_mtime and file_path in CaseFileHandler._cached_cases:
                return CaseFileHandler._cached_cases[file_path]
        except OSError: pass
        try:
            with open(file_path, "r", encoding="utf-8") as f: content = f.read()
            case = CaseFileHandler._parse_txt_content(content)
            CaseFileHandler._update_cache(file_path, case)
            return case
        except Exception as e:
            logger.error(f"فشل تحميل الملف {file_path}: {e}")
            return None

    @staticmethod
    def _parse_txt_content(content: str) -> CaseData:
        case = CaseData()
        current_mode = "general"
        section_lines, judgment_lines = [], []
        extended_field_map = dict(AppConstants.FIELD_MAP)
        extended_field_map["مرحلة مخصصة"] = "custom_stage"

        section_markers = {"المنطوق:": "judgment", "الأطراف:": "parties", "التأجيلات:": "delays", "التواريخ:": None, "التفاصيل الإضافية:": "notes"}

        for line in content.split('\n'):
            stripped = line.strip()
            if stripped in section_markers:
                if current_mode == "notes": case.notes = "\n".join(section_lines).strip(); section_lines.clear()
                current_mode = section_markers[stripped] or current_mode
                continue

            if not stripped:
                if current_mode == "notes": section_lines.append("")
                continue

            if current_mode == "general" and ":" in line:
                key_ar, val = line.split(":", 1)
                key_stripped = key_ar.strip()
                field_name = extended_field_map.get(key_stripped)
                if field_name and hasattr(case, field_name): setattr(case, field_name, val.strip())
            elif current_mode == "notes": section_lines.append(line)
            elif current_mode == "delays" and "|" in line:
                parts = line.split("|")
                if len(parts) >= 3: case.delays.append(DelayEntry(date=parts[1].strip(), reason=parts[2].strip()))
            elif current_mode == "parties" and "|" in line:
                case.parties.append(CaseFileHandler._parse_party_line(line))
            elif current_mode == "judgment": judgment_lines.append(line)

        if current_mode == "notes" and section_lines: case.notes = "\n".join(section_lines).strip()
        if judgment_lines: case.judgment = "\n".join(judgment_lines).strip()
        return case

    @staticmethod
    def _update_cache(file_path: str, case: Optional[CaseData]):
        try: CaseFileHandler._cache[file_path] = os.path.getmtime(file_path); CaseFileHandler._cached_cases[file_path] = case
        except OSError: pass

    @staticmethod
    def find_case_files(base_folder: str) -> List[str]:
        case_files = []
        if not base_folder or not os.path.exists(base_folder): return case_files
        try:
            for root_dir, _, files in os.walk(base_folder):
                if AppConstants.CASE_INFO_FILE in files: case_files.append(os.path.join(root_dir, AppConstants.CASE_INFO_FILE))
        except OSError as e: logger.error(f"خطأ في البحث عن الملفات: {e}")
        return case_files

    @staticmethod
    def get_all_sessions(base_folder: str, year: int, month: int) -> List[Dict]:
        """Get ALL sessions (past and future) for a specific month."""
        sessions = []
        if not base_folder or not os.path.exists(base_folder):
            return sessions
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1)
        else:
            month_end = date(year, month + 1, 1)
        for file_path in CaseFileHandler.find_case_files(base_folder):
            case = CaseFileHandler.load_case(file_path)
            if case is None:
                continue
            if case.first_session:
                session_date = CaseFileHandler._safe_parse_date(case.first_session)
                if session_date and month_start <= session_date < month_end:
                    sessions.append({
                        "date": session_date, "case_number": case.case_number, "court": case.court,
                        "reason": "أول جلسة", "file_path": file_path, "parties_summary": case.parties_summary,
                        "subject": case.subject, "nature": case.nature, "status": case.status, "status_color": case.status_color,
                    })
            for delay in case.delays:
                if delay.date:
                    delay_date = CaseFileHandler._safe_parse_date(delay.date)
                    if delay_date and month_start <= delay_date < month_end:
                        sessions.append({
                            "date": delay_date, "case_number": case.case_number, "court": case.court,
                            "reason": f"تأجيل: {delay.reason}", "file_path": file_path, "parties_summary": case.parties_summary,
                            "subject": case.subject, "nature": case.nature, "status": case.status, "status_color": case.status_color,
                        })
        sessions.sort(key=lambda s: s["date"])
        return sessions

    @staticmethod
    def get_upcoming_sessions(base_folder: str, reference_date: Optional[date] = None) -> List[Dict]:
        if reference_date is None: reference_date = datetime.today().date()
        sessions = []
        for file_path in CaseFileHandler.find_case_files(base_folder):
            case = CaseFileHandler.load_case(file_path)
            if case is None or case.status == "مؤرشفة": continue
            if case.first_session:
                session_date = CaseFileHandler._safe_parse_date(case.first_session)
                if session_date and session_date >= reference_date:
                    sessions.append({
                        "date": session_date, "case_number": case.case_number, "court": case.court,
                        "reason": "أول جلسة", "file_path": file_path, "parties_summary": case.parties_summary,
                        "subject": case.subject, "nature": case.nature, "status": case.status, "status_color": case.status_color,
                    })
            for delay in case.delays:
                if delay.date:
                    delay_date = CaseFileHandler._safe_parse_date(delay.date)
                    if delay_date and delay_date >= reference_date:
                        sessions.append({
                            "date": delay_date, "case_number": case.case_number, "court": case.court,
                            "reason": f"تأجيل: {delay.reason}", "file_path": file_path, "parties_summary": case.parties_summary,
                            "subject": case.subject, "nature": case.nature, "status": case.status, "status_color": case.status_color,
                        })
        sessions.sort(key=lambda s: s["date"])
        return sessions

    @staticmethod
    def _safe_parse_date(date_str: str) -> Optional[date]:
        date_str = date_str.strip()
        for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"]:
            try: return datetime.strptime(date_str, fmt).date()
            except ValueError: continue
        return None

    @staticmethod
    def _parse_party_line(line: str) -> "PartyEntry":
        parts = [p.strip() for p in line.split("|")]
        parts += [""] * max(0, 5 - len(parts))
        return PartyEntry(
            role=parts[0].replace("[", "").replace("]", "").strip(),
            name=parts[1], phone=parts[2],
            lawyer_name=parts[3], lawyer_phone=parts[4]
        )

    @staticmethod
    def search_cases(base_folder: str, keywords: str, court_filter: str = "", status_filter: str = "", nature_filter: str = "") -> List[str]:
        if not keywords.strip() and not court_filter and not status_filter and not nature_filter:
            return CaseFileHandler.find_case_files(base_folder)
        keyword_list = keywords.lower().strip().split() if keywords.strip() else []
        results = []
        for file_path in CaseFileHandler.find_case_files(base_folder):
            case = CaseFileHandler.load_case(file_path)
            if case is None: continue
            if court_filter and case.court != court_filter:
                continue
            if status_filter and case.status != status_filter:
                continue
            if nature_filter and case.nature != nature_filter:
                continue
            if keyword_list:
                searchable = " ".join([
                    case.case_number, case.court, case.council,
                    case.subject, case.nature, case.status,
                    case.notes, case.judgment, case.parties_summary,
                    case.lawyer, case.stage_display
                ]).lower()
                if all(kw in searchable for kw in keyword_list):
                    results.append(file_path)
            else:
                results.append(file_path)
        return results

# ──────────────────────────────────────────────
# الإعدادات
# ──────────────────────────────────────────────
class SettingsManager:
    def __init__(self, file_path: str = None):
        self.file_path = file_path or AppConstants.SETTINGS_FILE
        self.data = self._load()

    def _load(self) -> dict:
        try:
            if os.path.exists(self.file_path):
                with open(self.file_path, "r", encoding="utf-8") as f: return json.load(f)
        except (json.JSONDecodeError, OSError): pass
        return {}

    def save(self):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f: json.dump(self.data, f, ensure_ascii=False, indent=2)
        except OSError: pass

    @property
    def base_folder(self) -> str:
        folder = self.data.get("base_folder", "")
        if folder and os.path.exists(folder): return folder
        return ""

    @base_folder.setter
    def base_folder(self, value: str): self.data["base_folder"] = value; self.save()

    @property
    def autosave_enabled(self) -> bool: return self.data.get("autosave_enabled", True)

    @autosave_enabled.setter
    def autosave_enabled(self, value: bool): self.data["autosave_enabled"] = value; self.save()

    @property
    def lawyer_name(self) -> str: return self.data.get("lawyer_name", AppConstants.DEFAULT_LAWYER_NAME)
    @lawyer_name.setter
    def lawyer_name(self, value: str): self.data["lawyer_name"] = value; self.save()

    @property
    def lawyer_title(self) -> str: return self.data.get("lawyer_title", AppConstants.DEFAULT_LAWYER_TITLE)
    @lawyer_title.setter
    def lawyer_title(self, value: str): self.data["lawyer_title"] = value; self.save()

    @property
    def lawyer_address(self) -> str: return self.data.get("lawyer_address", AppConstants.DEFAULT_LAWYER_ADDRESS)
    @lawyer_address.setter
    def lawyer_address(self, value: str): self.data["lawyer_address"] = value; self.save()

    @property
    def lawyer_phone(self) -> str: return self.data.get("lawyer_phone", AppConstants.DEFAULT_LAWYER_PHONE)
    @lawyer_phone.setter
    def lawyer_phone(self, value: str): self.data["lawyer_phone"] = value; self.save()

# ──────────────────────────────────────────────
# أدوات واجهة المستخدم (UI Widgets)
# ──────────────────────────────────────────────
class RTLEntry(tk.Frame):
    def __init__(self, parent, width: int = 40, font=None, fg=None, bg=None, state: str = "normal", justify: str = "right", **kwargs):
        super().__init__(parent, **kwargs)
        self._state = state
        self._font = font or (AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL)
        self._fg = fg or AppConstants.COLORS["text_primary"]
        self._bg = bg or AppConstants.COLORS["bg_input"]

        self.text = tk.Text(self, height=1, width=width, font=self._font, fg=self._fg, bg=self._bg, relief="solid", bd=1, padx=8, pady=4, wrap="none", insertbackground=self._fg, selectbackground=AppConstants.COLORS["primary_accent"], selectforeground="white", undo=True, spacing1=0, spacing3=0)
        self.text.pack(fill="x", expand=True)

        self.text.bind("<Tab>", self._on_tab)
        self.text.bind("<Shift-Tab>", self._on_shift_tab)
        if state == "readonly": self.text.config(state="disabled")

        self.text.bind("<FocusIn>", self._on_focus_in)
        self.text.bind("<FocusOut>", self._on_focus_out)
        self._on_focus_out()

    def _on_focus_in(self, event=None):
        self.text.config(bg=AppConstants.COLORS["bg_input_focus"], highlightbackground=AppConstants.COLORS["border_focus"], highlightthickness=2, highlightcolor=AppConstants.COLORS["border_focus"])

    def _on_focus_out(self, event=None):
        self.text.config(bg=self._bg, highlightbackground=AppConstants.COLORS["border_light"], highlightthickness=1, highlightcolor=AppConstants.COLORS["border_light"])

    def _on_tab(self, event): self.text.tk_focusNext().focus_set(); return "break"
    def _on_shift_tab(self, event): self.text.tk_focusPrev().focus_set(); return "break"
    def get(self) -> str: return self.text.get("1.0", "end-1c").strip()
    def insert(self, index, text):
        if self._state == "readonly": self.text.config(state="normal")
        if index == 0 or index == "0": self.text.insert("1.0", text)
        else: self.text.insert("end", text)
        if self._state == "readonly": self.text.config(state="disabled")
    def delete(self, start, end=None):
        if self._state == "readonly": self.text.config(state="normal")
        self.text.delete("1.0", "end")
        if self._state == "readonly": self.text.config(state="disabled")
    def config(self, **kwargs):
        if 'state' in kwargs:
            self._state = kwargs.pop('state')
            if self._state == "readonly": self.text.config(state="disabled")
            elif self._state == "normal": self.text.config(state="normal")
        if 'fg' in kwargs: self.text.config(fg=kwargs.pop('fg'))
        if 'font' in kwargs: self.text.config(font=kwargs.pop('font'))
        if 'bg' in kwargs: self._bg = kwargs.pop('bg'); self.text.config(bg=self._bg)
        if kwargs: self.text.config(**kwargs)

class ScrollableFrame(tk.Frame):
    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)
        self.canvas = tk.Canvas(self, highlightthickness=0, bg=AppConstants.COLORS["bg_main"])
        self.scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = tk.Frame(self.canvas, bg=AppConstants.COLORS["bg_main"])
        
        self.scrollable_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        canvas_window = self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.bind("<Configure>", lambda e: self.canvas.itemconfig(canvas_window, width=e.width))
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.canvas.bind('<Enter>', lambda e: PlatformHelper.bind_mousewheel(self.canvas, self._on_mousewheel))
        self.canvas.bind('<Leave>', lambda e: PlatformHelper.unbind_mousewheel(self.canvas))
        
        self.canvas.pack(side="right", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")

    def _on_mousewheel(self, event):
        delta = PlatformHelper.get_mousewheel_delta(event)
        self.canvas.yview_scroll(delta, "units")

class StatusBar(tk.Frame):
    def __init__(self, parent, **kwargs):
        super().__init__(parent, bg=AppConstants.COLORS["bg_header"], height=28, **kwargs)
        self.clock_label = tk.Label(self, text="", anchor="w", padx=15, font=("Consolas", AppConstants.FONT_SIZE_SMALL), fg=AppConstants.COLORS["text_light"], bg=AppConstants.COLORS["bg_header"])
        self.clock_label.pack(fill="x", side="left")
        self._update_clock()
        self.label = tk.Label(self, text="جاهز", anchor="e", padx=15, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), fg=AppConstants.COLORS["text_light"], bg=AppConstants.COLORS["bg_header"])
        self.label.pack(fill="x", side="right")

    def _update_clock(self):
        try:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self.clock_label.config(text=now)
        except tk.TclError:
            return
        try:
            self.clock_label.after(1000, self._update_clock)
        except tk.TclError:
            pass

    def set_message(self, message: str): self.label.config(text=message, fg=AppConstants.COLORS["text_light"])
    def set_success(self, message: str): self.label.config(text=f"✓ {message}", fg=AppConstants.COLORS["secondary"])
    def set_warning(self, message: str): self.label.config(text=f"⚠ {message}", fg=AppConstants.COLORS["warning"])


# ──────────────────────────────────────────────
# بنّاء التقارير HTML
# ──────────────────────────────────────────────
class HTMLReportBuilder:
    @staticmethod
    def build(case: CaseData, settings: SettingsManager) -> str:
        stage_html = HTMLReportBuilder._build_stage_row(case)
        parties_html = HTMLReportBuilder._build_parties_rows(case.parties)
        delays_html = HTMLReportBuilder._build_delays_rows(case.delays)
        judgment_html = case.judgment.replace("\n", '<br>') if case.judgment else ""
        notes_html = case.notes.replace("\n", '<br>') if case.notes else "—"

        status_badge = f'<span style="background-color: {case.status_color}; color: white; padding: 2px 10px; border-radius: 10px; font-size: 12px;">{case.status}</span>'

        finance_html = f"""
        <table style="page-break-inside: avoid;">
            <tr><th>الأتعاب</th><td>{case.fees or '—'}</td>
                <th>المدفوع</th><td>{case.paid or '—'}</td></tr>
            <tr><th>المتبقي</th><td colspan="3" style="font-weight: bold; color: {AppConstants.COLORS['danger']};">{case.remaining:g}</td></tr>
        </table>"""

        manual_delays = ""
        for _ in range(6):
            manual_delays += f"""
            <div class="delay-row" style="margin-top: 10px; padding-bottom: 8px;">
                <span style="font-size: 14px;">تاريخ الجلسة: <span style="letter-spacing: 2px;">......./......./202...</span></span> 
                <strong style="margin-right: 20px; font-size: 14px;">السبب:</strong> <span style="letter-spacing: 2px;">..................................................................................................................</span>
            </div>
            """

        return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>ملف قضية - {case.case_number}</title>
    <style>
        @page {{ size: A4; margin: 0.8cm; }}
        * {{ box-sizing: border-box; direction: rtl; text-align: right; }}
        body {{ font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 8px; margin: 0 auto; color: #000; line-height: 1.4; max-width: 210mm; font-size: 13px; zoom: 0.85; }}
        
        .letterhead-box {{ 
            border: 2px solid #2c3e50; 
            padding: 10px; 
            text-align: center !important; 
            margin-bottom: 15px; 
            background-color: #fff; 
            border-radius: 6px; 
            display: block;
            width: 100%;
        }}
        .lh-name {{ font-size: 24px; font-weight: bold; margin: 0 0 5px 0; color: #2c3e50; text-align: center !important; display: block; }}
        .lh-title {{ font-size: 16px; margin: 0 0 5px 0; color: #2c3e50; font-weight: bold; text-align: center !important; display: block; }}
        .lh-address {{ font-size: 14px; margin: 0; color: #2c3e50; font-weight: bold; text-align: center !important; display: block; }}
        
        .doc-title {{ text-align: center; color: #2c3e50; font-size: 18px; font-weight: bold; border-bottom: 2px solid #2c3e50; padding-bottom: 4px; margin-bottom: 8px; page-break-after: avoid; page-break-inside: avoid; }}
        h3 {{ border-bottom: 1.5px solid #2c3e50; padding-bottom: 2px; color: #2c3e50; margin-top: 8px; margin-bottom: 5px; font-size: 14px; page-break-after: avoid; page-break-inside: avoid; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; background-color: #fff; border: 1.5px solid #2c3e50; border-radius: 4px; overflow: hidden; page-break-inside: avoid; }}
        th {{ background-color: #2c3e50; font-weight: bold; color: #fff; padding: 5px 6px; text-align: right; width: 18%; font-size: 12px; }}
        td {{ border: 1px solid #dfe6e9; padding: 4px 6px; text-align: right; color: #000; min-font-size: 12px; }}
        .judgment-box {{ border: 1.5px solid #2c3e50; padding: 6px; min-height: 40px; background-color: #fafafa; border-radius: 4px; font-size: 13px; line-height: 1.5; page-break-inside: avoid; }}
        .notes-box {{ border: 1px solid #bdc3c7; padding: 6px; min-height: 20px; background-color: #fafafa; border-radius: 4px; font-size: 12px; color: #2c3e50; page-break-inside: avoid; }}
        .delays-section {{ margin-top: 8px; padding: 10px; border: 1.5px solid #2c3e50; border-radius: 6px; background-color: #fff; font-size: 12px; }}
        .delay-row {{ border-bottom: 1px dashed #dfe6e9; min-height: 20px; margin-top: 3px; padding-bottom: 2px; }}
        .delay-row span {{ font-weight: bold; margin-left: 10px; }}
        @media print {{ body {{ padding: 0; margin: 0; zoom: 0.95; }} * {{ -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000 !important; }} th {{ background-color: #2c3e50 !important; color: #fff !important; }} table, .letterhead-box, .judgment-box, .notes-box, .delays-section {{ border: 2px solid #000 !important; }} td {{ border: 1.5px solid #000 !important; }} h3 {{ border-bottom: 2px solid #000 !important; }} }}
    </style>
</head>
<body>
    <div class="letterhead-box">
        <h1 class="lh-name">{settings.lawyer_name}</h1>
        <div class="lh-title">{settings.lawyer_title}</div>
        <div class="lh-address">{settings.lawyer_address} | هاتف: {settings.lawyer_phone}</div>
    </div>
    
    <div class="doc-title">بطاقة متابعة قضية {status_badge}</div>
    
    <h3 style="page-break-inside: avoid;">معلومات القضية الأساسية</h3>
    <table style="page-break-inside: avoid;">
        <tr><th>المحكمة / المجلس</th><td>{case.council} - {case.court}</td><th>رقم القضية</th><td><strong>{case.case_number}</strong></td></tr>
        {stage_html}
        <tr><th>القسم/الغرفة</th><td>{case.section}</td><th>طبيعة القضية</th><td>{case.nature}</td></tr>
        <tr><th>هاتف قاعة المحامين</th><td colspan="3" style="direction: ltr; text-align: right; font-weight: bold;">{case.bar_phone}</td></tr>
        <tr><th>الموضوع</th><td colspan="3">{case.subject}</td></tr>
    </table>
    {finance_html}
    
    <h3 style="page-break-inside: avoid;">التفاصيل الإضافية</h3>
    <div class="notes-box">{notes_html}</div>

    <h3 style="page-break-inside: avoid;">أطراف النزاع</h3>
    <table style="page-break-inside: avoid;">
        <tr style="background-color: #34495e;">
            <th style="color: #fff;">الاسم واللقب</th><th style="color: #fff;">الهاتف</th><th style="color: #fff;">المركز القانوني</th><th style="color: #fff;">اسم محاميه</th><th style="color: #fff;">هاتف المحامي</th>
        </tr>
        {parties_html}
    </table>

    <h3 style="page-break-inside: avoid;">التواريخ وسجل الجلسات والتأجيلات</h3>
    <table style="page-break-inside: avoid; margin-bottom: 10px;">
        <tr><th>تاريخ التسجيل</th><td><strong>{case.date_register or '—'}</strong></td><th>أول جلسة</th><td><strong>{case.first_session or '—'}</strong></td></tr>
        <tr><th>تاريخ المداولة</th><td colspan="3"><strong>{case.delib_date or '—'}</strong></td></tr>
    </table>
    <div class="delays-section">
        {delays_html}
        {manual_delays}
    </div>

    <h3 style="page-break-inside: avoid;">منطوق الحكم / القرار</h3>
    <div class="judgment-box">{judgment_html}</div>
</body>
</html>"""

    @staticmethod
    def _build_stage_row(case: CaseData) -> str:
        stage_display = case.stage_display
        if case.stage in AppConstants.STAGES_NEEDING_ORIG_CASE and case.orig_case_num:
            if case.stage == "استئنافية": lbl = "رقم القضية الأصلية"
            elif case.stage == "معارضة": lbl = "رقم القضية الغيابية"
            else: lbl = "رقم القضية محل البراءة"
            return f"<tr><th>مرحلة التقاضي</th><td>{stage_display}</td><th>{lbl}</th><td><strong>{case.orig_case_num}</strong></td></tr>"
        return f"<tr><th>مرحلة التقاضي</th><td colspan='3'>{stage_display}</td></tr>"

    @staticmethod
    def _build_parties_rows(parties: List[PartyEntry]) -> str:
        if not parties: return '<tr><td colspan="5" style="text-align: center;">—</td></tr>'
        return "".join(
            f"<tr><td><strong>{p.name}</strong></td><td>{p.phone}</td><td>{p.role}</td><td>{p.lawyer_name}</td><td>{p.lawyer_phone}</td></tr>"
            for p in parties
        )

    @staticmethod
    def _build_delays_rows(delays: List[DelayEntry]) -> str:
        if not delays: return ""
        return "".join(
            f"<div class='delay-row'><span>تاريخ الجلسة: <strong>{d.date}</strong></span> <strong style='margin-right: 15px;'>السبب:</strong> {d.reason}</div>"
            for d in delays
        )

# ──────────────────────────────────────────────
# بنّاء التقارير PDF (مع التوسيط الإجباري)
# ──────────────────────────────────────────────
class PDFReportBuilder:
    LOCAL_FONT_PATH = os.path.join(LOG_DIR, "FreeSerif.ttf")
    LOCAL_BOLD_PATH = os.path.join(LOG_DIR, "FreeSerifBold.ttf")
    LINUX_FONT_PATH = "/usr/share/fonts/truetype/freefont/FreeSerif.ttf"
    LINUX_BOLD_PATH = "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf"
    FONT_PATH = LOCAL_FONT_PATH if os.path.exists(LOCAL_FONT_PATH) else LINUX_FONT_PATH
    FONT_BOLD_PATH = LOCAL_BOLD_PATH if os.path.exists(LOCAL_BOLD_PATH) else LINUX_BOLD_PATH

    @staticmethod
    def is_available() -> bool: return PDF_ARABIC_AVAILABLE and FPDF_AVAILABLE and os.path.exists(PDFReportBuilder.FONT_PATH)

    @staticmethod
    def _ar(text: str) -> str:
        if not PDF_ARABIC_AVAILABLE: return text
        return get_display(arabic_reshaper.reshape(text))

    @staticmethod
    def build(case: CaseData, settings: SettingsManager) -> str:
        if not PDFReportBuilder.is_available(): raise RuntimeError("مكتبات PDF غير متاحة")
        pdf = FPDF()
        pdf.add_page(); pdf.set_auto_page_break(auto=True, margin=15)
        try:
            pdf.add_font('ArabicSerif', '', PDFReportBuilder.FONT_PATH)
            pdf.add_font('ArabicSerif', 'B', PDFReportBuilder.FONT_BOLD_PATH)
        except Exception as e: logger.error(f"خطأ في تحميل خطوط PDF: {e}"); raise
        
        pdf.set_text_color(0, 0, 0); pdf.set_draw_color(0, 0, 0)
        
        # --- تعديل التوسيط الإجباري للديباجة ---
        pdf.set_font('ArabicSerif', 'B', 20)
        pdf.cell(0, 10, PDFReportBuilder._ar(settings.lawyer_name.strip()), align='C', new_x='LMARGIN', new_y='NEXT')
        pdf.set_font('ArabicSerif', 'B', 13)
        pdf.cell(0, 7, PDFReportBuilder._ar(settings.lawyer_title.strip()), align='C', new_x='LMARGIN', new_y='NEXT')
        pdf.set_font('ArabicSerif', '', 9)
        pdf.cell(0, 5, PDFReportBuilder._ar(f"{settings.lawyer_address.strip()} | هاتف: {settings.lawyer_phone.strip()}"), align='C', new_x='LMARGIN', new_y='NEXT')
        pdf.set_line_width(0.8); pdf.line(10, pdf.get_y() + 3, 200, pdf.get_y() + 3); pdf.ln(6)
        # ---------------------------------------
        
        pdf.set_font('ArabicSerif', 'B', 14)
        pdf.cell(0, 8, PDFReportBuilder._ar("بطاقة متابعة قضية"), new_x='LMARGIN', new_y='NEXT', align='C'); pdf.ln(3)

        pdf.set_font('ArabicSerif', 'B', 11)
        pdf.cell(0, 7, PDFReportBuilder._ar("معلومات القضية الأساسية"), new_x='LMARGIN', new_y='NEXT', align='R'); pdf.line(10, pdf.get_y(), 200, pdf.get_y()); pdf.ln(2)
        info_items = [("رقم القضية", case.case_number), ("المحكمة / المجلس", f"{case.council} - {case.court}"), ("القسم / الغرفة", case.section), ("طبيعة القضية", case.nature), ("مرحلة التقاضي", case.stage_display), ("حالة القضية", case.status), ("الموضوع", case.subject)]
        if case.stage in AppConstants.STAGES_NEEDING_ORIG_CASE and case.orig_case_num:
            info_items.append(("رقم القضية الأصلية" if case.stage == "استئنافية" else ("رقم القضية الغيابية" if case.stage == "معارضة" else "رقم القضية محل البراءة"), case.orig_case_num))
        PDFReportBuilder._add_info_table(pdf, info_items)

        if case.notes and case.notes.strip():
            pdf.ln(3); pdf.set_font('ArabicSerif', 'B', 11)
            pdf.cell(0, 7, PDFReportBuilder._ar("التفاصيل الإضافية"), new_x='LMARGIN', new_y='NEXT', align='R'); pdf.line(10, pdf.get_y(), 200, pdf.get_y()); pdf.ln(2)
            pdf.set_font('ArabicSerif', '', 9)
            for line in case.notes.split('\n'):
                if line.strip(): pdf.cell(0, 5, PDFReportBuilder._ar(line.strip()), new_x='LMARGIN', new_y='NEXT', align='R')

        if case.parties:
            pdf.ln(3); pdf.set_font('ArabicSerif', 'B', 11)
            pdf.cell(0, 7, PDFReportBuilder._ar("أطراف النزاع"), new_x='LMARGIN', new_y='NEXT', align='R'); pdf.line(10, pdf.get_y(), 200, pdf.get_y()); pdf.ln(2)
            for p in case.parties:
                pdf.set_font('ArabicSerif', 'B', 9)
                pdf.cell(0, 6, PDFReportBuilder._ar(f"الاسم: {p.name}  |  الهاتف: {p.phone}  |  المركز: {p.role}"), new_x='LMARGIN', new_y='NEXT', align='R')
                pdf.set_font('ArabicSerif', '', 8)
                details = []
                if p.lawyer_name: details.append(PDFReportBuilder._ar(f"محاميه: {p.lawyer_name}") + (f" - هاتف المحامي: {p.lawyer_phone}" if p.lawyer_phone else ""))
                if details: pdf.cell(0, 5, "  |  ".join(details), new_x='LMARGIN', new_y='NEXT', align='R')
                pdf.ln(1)

        pdf.ln(3); pdf.set_font('ArabicSerif', 'B', 11)
        pdf.cell(0, 7, PDFReportBuilder._ar("التواريخ وسجل التأجيلات (للكتابة اليدوية)"), new_x='LMARGIN', new_y='NEXT', align='R'); pdf.line(10, pdf.get_y(), 200, pdf.get_y()); pdf.ln(2)
        pdf.set_font('ArabicSerif', 'B', 9)
        pdf.cell(0, 6, PDFReportBuilder._ar(f"تاريخ التسجيل: {case.date_register or '—'}    |    أول جلسة: {case.first_session or '—'}    |    تاريخ المداولة: {case.delib_date or '—'}"), new_x='LMARGIN', new_y='NEXT', align='R'); pdf.ln(3)
        pdf.set_font('ArabicSerif', '', 9)
        for d in case.delays: pdf.cell(0, 6, PDFReportBuilder._ar(f"تاريخ الجلسة: {d.date}  |  السبب: {d.reason}"), new_x='LMARGIN', new_y='NEXT', align='R')
        pdf.ln(2)
        for _ in range(5): pdf.cell(0, 8, PDFReportBuilder._ar("تاريخ الجلسة: ...../...../202..    |    السبب: ........................................................................"), new_x='LMARGIN', new_y='NEXT', align='R')

        if case.judgment and case.judgment.strip():
            pdf.ln(4); pdf.set_font('ArabicSerif', 'B', 11)
            pdf.cell(0, 7, PDFReportBuilder._ar("منطوق الحكم / القرار"), new_x='LMARGIN', new_y='NEXT', align='R'); pdf.line(10, pdf.get_y(), 200, pdf.get_y()); pdf.ln(2)
            pdf.set_font('ArabicSerif', '', 9)
            for line in case.judgment.split('\n'):
                if line.strip(): pdf.cell(0, 5, PDFReportBuilder._ar(line.strip()), new_x='LMARGIN', new_y='NEXT', align='R')

        safe_num = case.case_number.replace("/", "-").replace("\\", "-") if case.case_number else "unknown"
        report_path = os.path.join(LOG_DIR, f"Case_Report_{safe_num}.pdf")
        try: pdf.output(report_path)
        except Exception as e: logger.error(f"خطأ في حفظ PDF: {e}"); raise
        return report_path

    @staticmethod
    def _add_info_table(pdf, items: list):
        pdf.set_font('ArabicSerif', '', 9)
        for label, value in items:
            if not value: value = "—"
            pdf.set_font('ArabicSerif', 'B', 9); label_ar = PDFReportBuilder._ar(f"{label}:"); pdf.cell(45, 6, label_ar, align='R')
            pdf.set_font('ArabicSerif', '', 9); value_ar = PDFReportBuilder._ar(value); pdf.cell(0, 6, value_ar, new_x='LMARGIN', new_y='NEXT', align='R')

# ──────────────────────────────────────────────
# التطبيق الرئيسي النوافذ (إعدادات المحامي + الإحصائيات)
# ──────────────────────────────────────────────
class LawyerSettingsWindow:
    def __init__(self, parent, settings: SettingsManager):
        self.top = tk.Toplevel(parent)
        self.top.title("إعدادات مكتب المحامي (الديباجة)")
        self.top.geometry("600x400")
        self.top.configure(bg=AppConstants.COLORS["bg_main"])
        self.top.transient(parent)
        self.top.grab_set()
        
        self.settings = settings
        self._build()

    def _build(self):
        frame = tk.LabelFrame(self.top, text=" تخصيص معلومات الديباجة والتقارير ", font=(AppConstants.FONT_FAMILY, 12, 'bold'), bg="white", padx=20, pady=20)
        frame.pack(fill="both", expand=True, padx=20, pady=20)

        tk.Label(frame, text="الاسم واللقب:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white").grid(row=0, column=1, sticky="e", pady=10)
        self.name_entry = RTLEntry(frame, width=40)
        self.name_entry.grid(row=0, column=0, sticky="we", padx=10)
        self.name_entry.insert(0, self.settings.lawyer_name)

        tk.Label(frame, text="الصفة:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white").grid(row=1, column=1, sticky="e", pady=10)
        self.title_entry = RTLEntry(frame, width=40)
        self.title_entry.grid(row=1, column=0, sticky="we", padx=10)
        self.title_entry.insert(0, self.settings.lawyer_title)

        tk.Label(frame, text="عنوان المكتب:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white").grid(row=2, column=1, sticky="e", pady=10)
        self.address_entry = RTLEntry(frame, width=40)
        self.address_entry.grid(row=2, column=0, sticky="we", padx=10)
        self.address_entry.insert(0, self.settings.lawyer_address)

        tk.Label(frame, text="الهاتف / الفاكس:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white").grid(row=3, column=1, sticky="e", pady=10)
        self.phone_entry = RTLEntry(frame, width=40)
        self.phone_entry.grid(row=3, column=0, sticky="we", padx=10)
        self.phone_entry.insert(0, self.settings.lawyer_phone)

        btn_frame = tk.Frame(frame, bg="white")
        btn_frame.grid(row=4, column=0, columnspan=2, pady=20)
        
        save_btn = tk.Button(btn_frame, text="💾 حفظ التغييرات", command=self._save, bg=AppConstants.COLORS["success"], fg="white", font=(AppConstants.FONT_FAMILY, 11, "bold"), relief="flat", padx=20, pady=5, cursor="hand2")
        save_btn.pack(side="right", padx=10)
        cancel_btn = tk.Button(btn_frame, text="إلغاء", command=self.top.destroy, bg=AppConstants.COLORS["text_secondary"], fg="white", font=(AppConstants.FONT_FAMILY, 11), relief="flat", padx=20, pady=5, cursor="hand2")
        cancel_btn.pack(side="right")

    def _save(self):
        self.settings.lawyer_name = self.name_entry.get()
        self.settings.lawyer_title = self.title_entry.get()
        self.settings.lawyer_address = self.address_entry.get()
        self.settings.lawyer_phone = self.phone_entry.get()
        messagebox.showinfo("نجاح", "تم حفظ إعدادات المحامي بنجاح. ستظهر هذه المعلومات في جميع التقارير والديباجات الجديدة.", parent=self.top)
        self.top.destroy()


class CSVExporter:
    HEADERS = [
        "رقم القضية", "المحكمة", "المجلس", "القسم",
        "طبيعة القضية", "مرحلة التقاضي", "حالة القضية",
        "الاطراف", "الموضوع", "الاتعاب", "المدفوع", "المتبقي",
        "تاريخ التسجيل", "اول جلسة", "تاريخ المداولة",
    ]

    @staticmethod
    def export(base_folder: str, output_path: str) -> tuple:
        files = CaseFileHandler.find_case_files(base_folder)
        exported, errors = 0, 0
        with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(CSVExporter.HEADERS)
            for fp in files:
                case = CaseFileHandler.load_case(fp)
                if case is None:
                    errors += 1
                    continue
                try:
                    writer.writerow([
                        case.case_number, case.court, case.council, case.section,
                        case.nature, case.stage_display, case.status,
                        case.parties_summary, case.subject,
                        case.fees or "0", case.paid or "0",
                        str(round(case.remaining, 2)),
                        case.date_register, case.first_session, case.delib_date,
                    ])
                    exported += 1
                except Exception as e:
                    logger.error(f"خطأ في تصدير {fp}: {e}")
                    errors += 1
        return exported, errors


class SessionAlertsManager:
    @staticmethod
    def check_and_alert(base_folder: str, parent_window, threshold_days: int = None):
        if not base_folder or not os.path.exists(base_folder): return
        if threshold_days is None: threshold_days = AppConstants.URGENT_DAYS_THRESHOLD
        try:
            sessions = CaseFileHandler.get_upcoming_sessions(base_folder)
            today = datetime.today().date()
            urgent = [s for s in sessions if 0 <= (s["date"] - today).days <= threshold_days]
            if not urgent: return
            parts = [f"لديك {len(urgent)} جلسة خلال {threshold_days} ايام:\n"]
            for s in urgent[:8]:
                d = (s["date"] - today).days
                label = "اليوم" if d == 0 else ("غداً" if d == 1 else f"بعد {d} ايام")
                parts.append(f"* [{label}] {s['date']} - {s['case_number']} ({s['court']})")
                parts.append(f"  {s['reason']}")
            if len(urgent) > 8: parts.append(f"... و{len(urgent) - 8} جلسة اخرى")
            messagebox.showwarning("تنبيه بالجلسات القادمة", "\n".join(parts), parent=parent_window)
        except Exception as e: logger.error(f"خطأ في التنبيهات: {e}")


class StatisticsWindow:
    PIE_COLORS = [
        "#27ae60", "#f39c12", "#3498db", "#95a5a6",
        "#e74c3c", "#8e44ad", "#2980b9", "#d35400",
        "#16a085", "#c0392b", "#7f8c8d", "#1abc9c",
    ]

    def __init__(self, parent, base_folder: str):
        self.parent = parent
        self.base_folder = base_folder
        self._build()

    def _build(self):
        win = tk.Toplevel(self.parent)
        win.title("احصاءات القضايا")
        win.geometry("820x580")
        win.configure(bg=AppConstants.COLORS["bg_main"])
        
        cases = []
        for fp in CaseFileHandler.find_case_files(self.base_folder):
            c = CaseFileHandler.load_case(fp)
            if c: cases.append(c)
        
        if not cases:
            tk.Label(win, text="لا توجد قضايا.", font=(AppConstants.FONT_FAMILY, 14), bg=AppConstants.COLORS["bg_main"]).pack(expand=True)
            return
            
        hdr = tk.Frame(win, bg=AppConstants.COLORS["bg_header"], pady=10); hdr.pack(fill="x")
        tk.Label(hdr, text=f"احصاءات القضايا - الاجمالي: {len(cases)} قضية", font=(AppConstants.FONT_FAMILY, 13, "bold"), bg=AppConstants.COLORS["bg_header"], fg=AppConstants.COLORS["text_white"]).pack()
        
        cf = tk.Frame(win, bg=AppConstants.COLORS["bg_main"], pady=8); cf.pack(fill="x", padx=20)

        def safe_float(v): 
            try: return float(v.strip()) if v and v.strip() else 0.0
            except: return 0.0

        t_fees = sum(safe_float(c.fees) for c in cases)
        t_paid = sum(safe_float(c.paid) for c in cases)
        t_remain = sum(c.remaining for c in cases)
        active = sum(1 for c in cases if c.status == "جارية")
        
        for i, (lbl, val, clr) in enumerate([
            ("القضايا الجارية", str(active), AppConstants.COLORS["status_active"]),
            ("اجمالي الاتعاب", f"{t_fees:,.0f} دج", AppConstants.COLORS["primary_accent"]),
            ("اجمالي المدفوع", f"{t_paid:,.0f} دج", AppConstants.COLORS["secondary"]),
            ("اجمالي المتبقي", f"{t_remain:,.0f} دج", AppConstants.COLORS["danger"]),
        ]):
            card = tk.Frame(cf, bg=AppConstants.COLORS["bg_card"], relief="ridge", bd=1, padx=12, pady=8)
            card.grid(row=0, column=i, padx=6, sticky="nsew"); cf.columnconfigure(i, weight=1)
            tk.Label(card, text=val, font=(AppConstants.FONT_FAMILY, 15, "bold"), fg=clr, bg=AppConstants.COLORS["bg_card"]).pack()
            tk.Label(card, text=lbl, font=(AppConstants.FONT_FAMILY, 9), fg=AppConstants.COLORS["text_secondary"], bg=AppConstants.COLORS["bg_card"]).pack()
            
        charts = tk.Frame(win, bg=AppConstants.COLORS["bg_main"])
        charts.pack(fill="both", expand=True, padx=20, pady=8)
        s_counts = {}
        for c in cases: s_counts[c.status] = s_counts.get(c.status, 0) + 1
        n_counts = {}
        for c in cases:
            if c.nature: n_counts[c.nature] = n_counts.get(c.nature, 0) + 1
        top6 = dict(sorted(n_counts.items(), key=lambda x: x[1], reverse=True)[:6])
        
        lf = tk.LabelFrame(charts, text=" توزيع حسب الحالة ", font=(AppConstants.FONT_FAMILY, 10, "bold"), bg=AppConstants.COLORS["bg_main"])
        lf.pack(side="left", fill="both", expand=True, padx=(0, 5))
        rf = tk.LabelFrame(charts, text=" توزيع حسب الطبيعة ", font=(AppConstants.FONT_FAMILY, 10, "bold"), bg=AppConstants.COLORS["bg_main"])
        rf.pack(side="right", fill="both", expand=True, padx=(5, 0))
        StatisticsWindow._draw_pie(lf, s_counts); StatisticsWindow._draw_pie(rf, top6)

        # Financial Summary Cards
        fin_frame = tk.Frame(win, bg=AppConstants.COLORS["bg_main"], pady=8); fin_frame.pack(fill="x", padx=20, pady=(5, 10))
        tk.Label(fin_frame, text="📊 الملخص المالي", font=(AppConstants.FONT_FAMILY, 11, "bold"), bg=AppConstants.COLORS["bg_main"], fg=AppConstants.COLORS["primary"]).pack(anchor="e", pady=(0, 5))
        fin_cards = tk.Frame(fin_frame, bg=AppConstants.COLORS["bg_main"]); fin_cards.pack(fill="x")
        for j, (flbl, fval, fclr) in enumerate([
            ("إجمالي الأتعاب", f"{t_fees:,.0f} دج", AppConstants.COLORS["primary_accent"]),
            ("إجمالي المدفوع", f"{t_paid:,.0f} دج", AppConstants.COLORS["secondary"]),
            ("إجمالي المتبقي", f"{t_remain:,.0f} دج", AppConstants.COLORS["danger"]),
        ]):
            fcard = tk.Frame(fin_cards, bg=AppConstants.COLORS["bg_card"], relief="ridge", bd=1, padx=12, pady=8)
            fcard.grid(row=0, column=j, padx=6, sticky="nsew"); fin_cards.columnconfigure(j, weight=1)
            tk.Label(fcard, text=fval, font=(AppConstants.FONT_FAMILY, 15, "bold"), fg=fclr, bg=AppConstants.COLORS["bg_card"]).pack()
            tk.Label(fcard, text=flbl, font=(AppConstants.FONT_FAMILY, 9), fg=AppConstants.COLORS["text_secondary"], bg=AppConstants.COLORS["bg_card"]).pack()

    @staticmethod
    def _draw_pie(parent, data: dict):
        if not data:
            tk.Label(parent, text="لا بيانات", bg=AppConstants.COLORS["bg_main"]).pack(expand=True)
            return
        canvas = tk.Canvas(parent, bg=AppConstants.COLORS["bg_card"], highlightthickness=0, width=300, height=220)
        canvas.pack(fill="both", expand=True, padx=4, pady=4)
        total = sum(data.values())
        cx, cy, r = 105, 110, 85
        start = 0.0
        legend_y = 12
        for i, (label, count) in enumerate(data.items()):
            extent = (count / total) * 360
            color = StatisticsWindow.PIE_COLORS[i % len(StatisticsWindow.PIE_COLORS)]
            canvas.create_arc(cx-r, cy-r, cx+r, cy+r, start=start, extent=extent, fill=color, outline="white", width=2)
            start += extent
            canvas.create_rectangle(215, legend_y, 229, legend_y+11, fill=color, outline="")
            short = (label[:11] + "..") if len(label) > 12 else label
            canvas.create_text(231, legend_y+6, anchor="w", text=f"{short} ({count})", font=(AppConstants.FONT_FAMILY, 8), fill=AppConstants.COLORS["text_primary"])
            legend_y += 18
        canvas.create_oval(cx-38, cy-38, cx+38, cy+38, fill="white", outline="white")
        canvas.create_text(cx, cy, text=str(total), font=(AppConstants.FONT_FAMILY, 13, "bold"), fill=AppConstants.COLORS["text_primary"])
        canvas.create_text(cx, cy+16, text="قضية", font=(AppConstants.FONT_FAMILY, 8), fill=AppConstants.COLORS["text_secondary"])


# ──────────────────────────────────────────────
# الكلاس الرئيسي للتطبيق
# ──────────────────────────────────────────────
class CaseManagerApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(AppConstants.APP_TITLE)
        self.root.geometry(AppConstants.APP_GEOMETRY)
        self.root.minsize(*AppConstants.APP_MIN_SIZE)
        self.root.configure(bg=AppConstants.COLORS["bg_main"])

        self.settings = SettingsManager()
        self.current_file: str = ""
        self.entries: Dict[str, Any] = {}
        self.parties_widgets: List[Tuple] = []
        self.delays_widgets: List[Tuple] = []
        self._autosave_job = None
        self._dirty = False
        self._current_page = "dashboard"
        self._sidebar_buttons = {}
        self._page_frames = {}
        self._welcome_frame = None

        try:
            self._setup_styles(); self._setup_ui(); self._setup_keybindings()
        except Exception as e:
            logger.error(f"خطأ في إعداد الواجهة: {e}"); messagebox.showerror("خطأ", f"حدث خطأ أثناء إعداد الواجهة:\n{e}")

        if self.settings.base_folder:
            self._on_folder_selected(self.settings.base_folder)
            self._hide_welcome()
        else:
            self._show_welcome()
        self._start_autosave(); self.root.after(500, self._update_dashboard)

    def _setup_styles(self):
        self.style = ttk.Style()
        try: self.style.theme_use('clam')
        except tk.TclError: pass

        self.style.configure('TNotebook', background=AppConstants.COLORS["bg_main"], borderwidth=0)
        self.style.configure('TNotebook.Tab', font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, 'bold'), padding=[18, 8], background=AppConstants.COLORS["bg_card"], foreground=AppConstants.COLORS["text_primary"])
        self.style.map('TNotebook.Tab', background=[('selected', AppConstants.COLORS["primary_accent"])], foreground=[('selected', AppConstants.COLORS["text_white"])], expand=[('selected', [0, 0, 0, 2])])
        self.style.configure('Treeview', font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), rowheight=32, background=AppConstants.COLORS["bg_card"], fieldbackground=AppConstants.COLORS["bg_card"])
        self.style.configure('Treeview.Heading', font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, 'bold'), background=AppConstants.COLORS["primary"], foreground=AppConstants.COLORS["text_white"], padding=[5, 5])
        self.style.map('Treeview', background=[('selected', AppConstants.COLORS["primary_accent"])], foreground=[('selected', AppConstants.COLORS["text_white"])])
        self.style.configure('TCombobox', font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), padding=5)

    def _setup_keybindings(self):
        self.root.bind(AppConstants.KEYBINDINGS["save"], lambda e: self._update_file())
        self.root.bind(AppConstants.KEYBINDINGS["new"], lambda e: self._new_case())
        self.root.bind(AppConstants.KEYBINDINGS["search"], lambda e: self._focus_search())
        self.root.bind(AppConstants.KEYBINDINGS["quit"], lambda e: self._on_close())

    def _focus_search(self):
        self._switch_page("search")
        if hasattr(self, 'search_entry'): self.search_entry.focus_set()

    def _setup_ui(self):
        self._setup_top_bar()
        # Main container: sidebar + content
        self.main_container = tk.Frame(self.root, bg=AppConstants.COLORS["bg_main"])
        self.main_container.pack(fill="both", expand=True, padx=0, pady=0)
        # Sidebar
        self._setup_sidebar()
        # Content area
        self.content_area = tk.Frame(self.main_container, bg=AppConstants.COLORS["bg_main"])
        self.content_area.pack(side="right", fill="both", expand=True, padx=8, pady=(4, 0))
        # Create all page frames (hidden by default)
        self._setup_tab_dashboard()
        self._setup_tab_case()
        self._setup_tab_operations()
        self._setup_tab_search()
        self._setup_tab_archive()
        self._setup_tab_calendar()
        self._setup_status_bar()

    def _setup_top_bar(self):
        top = tk.Frame(self.root, bg=AppConstants.COLORS["bg_header"], padx=15, pady=8); top.pack(fill="x")
        tk.Label(top, text="⚖", font=("Segoe UI", 18), bg=AppConstants.COLORS["bg_header"], fg=AppConstants.COLORS["primary_accent"]).pack(side="left", padx=(0, 5))
        tk.Label(top, text=AppConstants.APP_TITLE, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_LARGE, 'bold'), bg=AppConstants.COLORS["bg_header"], fg=AppConstants.COLORS["text_white"]).pack(side="left")
        btn = self._make_button(top, "تغيير المجلد الرئيسي", self._choose_folder, bg=AppConstants.COLORS["primary_accent"], icon="📂")
        btn.pack(side="right")
        self.folder_label = tk.Label(top, text="لم يتم اختيار مجلد...", fg=AppConstants.COLORS["text_light"], font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), bg=AppConstants.COLORS["bg_header"]); self.folder_label.pack(side="right", padx=15)
    def _setup_sidebar(self):
        self.sidebar = tk.Frame(self.main_container, bg="#1a252f", width=200)
        self.sidebar.pack(side="right", fill="y")
        self.sidebar.pack_propagate(False)
        # App title
        tk.Label(self.sidebar, text="⚖ نظام إدارة القضايا", font=(AppConstants.FONT_FAMILY, 11, "bold"), fg="#3498db", bg="#1a252f").pack(pady=(15, 0), padx=10)
        tk.Label(self.sidebar, text="v9.0", font=(AppConstants.FONT_FAMILY, 9), fg="#7f8c8d", bg="#1a252f").pack(pady=(0, 15), padx=10)
        # Separator
        tk.Frame(self.sidebar, bg="#3498db", height=2).pack(fill="x", padx=10, pady=(0, 10))
        # Navigation buttons
        nav_items = [
            ("dashboard", "الرئيسية 📋"),
            ("case", "ملف القضية 📁"),
            ("operations", "إدارة الملف ⚙"),
            ("search", "البحث 🔍"),
            ("archive", "الأرشيف 📚"),
            ("calendar", "التقويم 📅"),
        ]
        for page_id, label in nav_items:
            btn_frame = tk.Frame(self.sidebar, bg="#1a252f")
            btn_frame.pack(fill="x", padx=5, pady=2)
            # Left border indicator (hidden initially)
            border = tk.Frame(btn_frame, bg="#1a252f", width=3)
            border.pack(side="right", fill="y")
            btn = tk.Button(btn_frame, text=label, font=(AppConstants.FONT_FAMILY, 11), fg="white", bg="#1a252f",
                          activebackground="#3498db", activeforeground="white", relief="flat", bd=0,
                          cursor="hand2", anchor="e", padx=10, pady=8,
                          command=lambda pid=page_id: self._switch_page(pid))
            btn.pack(fill="x", side="right", expand=True)
            btn.bind("<Enter>", lambda e, b=btn: b.config(bg="#34495e") if b.cget("bg") == "#1a252f" else None)
            btn.bind("<Leave>", lambda e, b=btn, bid=page_id: b.config(bg="#3498db") if bid == self._current_page else b.config(bg="#1a252f"))
            self._sidebar_buttons[page_id] = {"btn": btn, "border": border, "frame": btn_frame}

    def _switch_page(self, page_id: str):
        self._current_page = page_id
        # Hide all page frames
        for pid, frame in self._page_frames.items():
            frame.pack_forget()
        # Show selected page
        if page_id in self._page_frames:
            self._page_frames[page_id].pack(fill="both", expand=True)
        # Update sidebar button styles
        for pid, items in self._sidebar_buttons.items():
            if pid == page_id:
                items["btn"].config(bg="#3498db")
                items["border"].config(bg="#3498db")
            else:
                items["btn"].config(bg="#1a252f")
                items["border"].config(bg="#1a252f")

    def _show_welcome(self):
        if self._welcome_frame:
            self._welcome_frame.pack_forget()
        self._welcome_frame = tk.Frame(self.content_area, bg=AppConstants.COLORS["bg_main"])
        self._welcome_frame.pack(fill="both", expand=True)
        inner = tk.Frame(self._welcome_frame, bg=AppConstants.COLORS["bg_card"], relief="ridge", bd=1, padx=40, pady=40)
        inner.place(relx=0.5, rely=0.5, anchor="center")
        tk.Label(inner, text="⚖", font=("Segoe UI", 72), bg=AppConstants.COLORS["bg_card"], fg=AppConstants.COLORS["primary_accent"]).pack(pady=(0, 20))
        tk.Label(inner, text="مرحباً بك في نظام إدارة القضايا", font=(AppConstants.FONT_FAMILY, 18, "bold"), bg=AppConstants.COLORS["bg_card"], fg=AppConstants.COLORS["primary"]).pack(pady=(0, 10))
        tk.Label(inner, text="اختر مجلد القضايا للبدء", font=(AppConstants.FONT_FAMILY, 13), bg=AppConstants.COLORS["bg_card"], fg=AppConstants.COLORS["text_secondary"]).pack(pady=(0, 25))
        folder_btn = tk.Button(inner, text="📂 اختيار مجلد القضايا", font=(AppConstants.FONT_FAMILY, 12, "bold"),
                             bg=AppConstants.COLORS["primary_accent"], fg="white", relief="flat", padx=25, pady=10,
                             cursor="hand2", command=self._choose_folder)
        folder_btn.pack()

    def _hide_welcome(self):
        if self._welcome_frame and self._welcome_frame.winfo_exists():
            self._welcome_frame.pack_forget()
        self._welcome_frame = None
        # Show dashboard
        self._switch_page("dashboard")



    def _setup_status_bar(self):
        self.status_bar = StatusBar(self.root); self.status_bar.pack(fill="x", side="bottom")
        self.status_bar.set_message("جاهز — Ctrl+S حفظ | Ctrl+N جديد | Ctrl+F بحث")

    def _create_section(self, parent, title: str) -> tk.LabelFrame:
        return tk.LabelFrame(parent, text=f"  {title}  ", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_MEDIUM, 'bold'), fg=AppConstants.COLORS["primary"], bg=AppConstants.COLORS["bg_card"], padx=12, pady=8, bd=1, relief="solid", highlightbackground=AppConstants.COLORS["border_light"])

    def _create_labeled_entry(self, parent, label_text: str, row: int, key: str, width: int = 40, state: str = "normal", fg: str = None, font: tuple = None) -> RTLEntry:
        parent.columnconfigure(0, weight=1); parent.columnconfigure(1, weight=3); parent.columnconfigure(2, weight=0)
        lbl = tk.Label(parent, text=label_text, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), fg=AppConstants.COLORS["text_primary"], bg=parent.cget('bg')); lbl.grid(row=row, column=2, sticky="e", padx=5, pady=5)
        entry_font = font or (AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL); entry_fg = fg or AppConstants.COLORS["text_primary"]
        entry = RTLEntry(parent, width=width, font=entry_font, fg=entry_fg, state=state); entry.grid(row=row, column=1, sticky="we", padx=5, pady=5)
        self.entries[key] = entry
        return entry

    def _create_labeled_date(self, parent, label_text: str, row: int, key: str):
        parent.columnconfigure(0, weight=1)
        lbl = tk.Label(parent, text=label_text, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), fg=AppConstants.COLORS["text_primary"], bg=parent.cget('bg')); lbl.grid(row=row, column=2, sticky="e", padx=5, pady=5)
        if TKCALENDAR_AVAILABLE:
            date_entry = DateEntry(parent, width=15, date_pattern='yyyy-mm-dd', font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), background=AppConstants.COLORS["primary"], foreground='white')
            date_entry.grid(row=row, column=1, sticky="we", padx=5, pady=5); self._clear_date_entry(date_entry)
        else:
            date_entry = tk.Entry(parent, width=17, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_input"], fg=AppConstants.COLORS["text_primary"], relief="solid")
            date_entry.insert(0, "yyyy-mm-dd"); date_entry.grid(row=row, column=1, sticky="we", padx=5, pady=5)
        btn_clear = tk.Button(parent, text="✖", fg=AppConstants.COLORS["danger"], relief="flat", font=("Segoe UI", 9), cursor="hand2", bd=0, bg=parent.cget('bg'), command=lambda: self._clear_date_entry(date_entry))
        btn_clear.grid(row=row, column=0, sticky="e", padx=2); self.entries[key] = date_entry
        return date_entry

    @staticmethod
    def _clear_date_entry(date_entry):
        try:
            if TKCALENDAR_AVAILABLE and isinstance(date_entry, DateEntry): date_entry.delete(0, tk.END)
            else: date_entry.delete(0, tk.END)
        except tk.TclError:
            try:
                if TKCALENDAR_AVAILABLE and isinstance(date_entry, DateEntry): date_entry.set_date("")
                else: date_entry.delete(0, tk.END)
            except (ValueError, tk.TclError): pass

    @staticmethod
    def _get_date_value(date_entry) -> str:
        try:
            if TKCALENDAR_AVAILABLE and isinstance(date_entry, DateEntry): return date_entry.get()
            else: val = date_entry.get().strip(); return "" if val == "yyyy-mm-dd" or not val else val
        except (tk.TclError, ValueError): return ""

    @staticmethod
    def _set_date_value(date_entry, value: str):
        if not value: CaseManagerApp._clear_date_entry(date_entry); return
        try:
            if TKCALENDAR_AVAILABLE and isinstance(date_entry, DateEntry): date_entry.set_date(value)
            else: date_entry.delete(0, tk.END); date_entry.insert(0, value)
        except (ValueError, tk.TclError): CaseManagerApp._clear_date_entry(date_entry)

    def _make_button(self, parent, text: str, command, bg: str = None, fg: str = "white", icon: str = "") -> tk.Button:
        btn_text = f"{icon} {text}" if icon else text
        bg_color = bg or AppConstants.COLORS["primary"]
        active_bg = AppConstants.adjust_color_brightness(bg_color, 20)
        
        btn = tk.Button(parent, text=btn_text, command=command, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, "bold"), bg=bg_color, fg=fg, activebackground=active_bg, activeforeground="white", relief="flat", bd=0, padx=16, pady=6, cursor="hand2")
        btn.bind("<Enter>", lambda e: e.widget.config(bg=active_bg))
        btn.bind("<Leave>", lambda e: e.widget.config(bg=bg_color))
        return btn

    def _mark_dirty(self):
        if not self._dirty:
            self._dirty = True
            if self.current_file: self.status_bar.set_warning("تعديلات غير محفوظة — Ctrl+S للحفظ")

    def _setup_tab_dashboard(self):
        t0 = tk.Frame(self.content_area, padx=15, pady=15, bg=AppConstants.COLORS["bg_main"])
        self._page_frames["dashboard"] = t0
        stats_frame = tk.Frame(t0, bg=AppConstants.COLORS["bg_main"]); stats_frame.pack(fill="x", pady=(0, 10))
        self.stat_cards = {}
        cards_data = [("total", "إجمالي القضايا", "0", AppConstants.COLORS["primary"]), ("active", "قضايا جارية", "0", AppConstants.COLORS["status_active"]), ("upcoming", "جلسات قادمة", "0", AppConstants.COLORS["warning"]), ("urgent", "جلسات عاجلة", "0", AppConstants.COLORS["danger"])]
        for key, title, value, color in cards_data:
            card_outer = tk.Frame(stats_frame, bg=AppConstants.COLORS["bg_main"])
            card_outer.pack(side="right", padx=5, fill="y", expand=True)
            # Colored left border trick
            border = tk.Frame(card_outer, bg=color, width=3)
            border.pack(side="right", fill="y")
            card = tk.Frame(card_outer, bg=AppConstants.COLORS["bg_card"], padx=18, pady=14, bd=0, relief="flat")
            card.pack(side="right", fill="both", expand=True)
            tk.Label(card, text=value, font=(AppConstants.FONT_FAMILY, 22, "bold"), fg=color, bg=AppConstants.COLORS["bg_card"]).pack()
            tk.Label(card, text=title, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), fg=AppConstants.COLORS["text_secondary"], bg=AppConstants.COLORS["bg_card"]).pack()
            self.stat_cards[key] = card

        top_frame = tk.Frame(t0, bg=AppConstants.COLORS["bg_main"]); top_frame.pack(fill="x", pady=5)
        self._make_button(top_frame, "تحديث لوحة الجلسات", self._update_dashboard, bg=AppConstants.COLORS["primary_accent"], icon="🔄").pack(side="right", padx=5)
        tk.Label(top_frame, text="اللون الأحمر = جلسة عاجلة (خلال 3 أيام) | انقر مرتين لفتح القضية", fg=AppConstants.COLORS["text_secondary"], font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), bg=AppConstants.COLORS["bg_main"]).pack(side="right", padx=15)

        columns = ("date", "case_num", "court", "nature", "reason", "parties", "status", "path")
        self.dash_tree = ttk.Treeview(t0, columns=columns, show="headings", height=12)
        self.dash_tree.heading("date", text="📅 التاريخ"); self.dash_tree.heading("case_num", text="🔢 رقم القضية"); self.dash_tree.heading("court", text="🏛 المحكمة"); self.dash_tree.heading("nature", text="📋 الطبيعة"); self.dash_tree.heading("reason", text="📝 البيان"); self.dash_tree.heading("parties", text="👥 الأطراف"); self.dash_tree.heading("status", text="⬤ الحالة")
        for col, width in zip(columns, [100, 100, 130, 80, 150, 220, 80]): self.dash_tree.column(col, width=width, anchor="center")
        self.dash_tree.column("path", width=0, stretch=tk.NO); self.dash_tree.tag_configure('urgent', foreground=AppConstants.COLORS["text_urgent"], font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, 'bold'))
        self.dash_tree.pack(fill="both", expand=True, pady=5); self.dash_tree.bind("<Double-Button-1>", self._open_case_from_dashboard)

        detail_frame = tk.LabelFrame(t0, text="  📄 تفاصيل القضية المحددة  ", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, 'bold'), fg=AppConstants.COLORS["primary"], bg=AppConstants.COLORS["bg_card"], padx=10, pady=8, height=220)
        detail_frame.pack(fill="x", pady=(5, 0)); detail_frame.pack_propagate(False)
        self.detail_text = tk.Text(detail_frame, wrap="word", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_input"], fg=AppConstants.COLORS["text_primary"], relief="flat", bd=0, state="disabled")
        self.detail_text.pack(fill="both", expand=True)
        self.detail_text.tag_configure("header", foreground=AppConstants.COLORS["primary_accent"], font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, "bold"))
        self.detail_text.tag_configure("money", foreground=AppConstants.COLORS["danger"], font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, "bold"))
        self.dash_tree.bind("<<TreeviewSelect>>", self._on_dashboard_select)

    def _on_dashboard_select(self, event):
        selected = self.dash_tree.selection()
        if not selected: return
        item = self.dash_tree.item(selected[0])
        file_path = item['values'][7] if len(item['values']) > 7 else ""
        case = CaseFileHandler.load_case(file_path) if file_path and os.path.exists(str(file_path)) else None

        self.detail_text.config(state="normal"); self.detail_text.delete("1.0", tk.END)
        if case:
            self.detail_text.insert(tk.END, "📌 البيانات الأساسية:\n", "header")
            self.detail_text.insert(tk.END, f"رقم القضية: {case.case_number}   |   المحكمة: {case.court}   |   المجلس: {case.council or '—'}\n")
            self.detail_text.insert(tk.END, f"الطبيعة: {case.nature}   |   المرحلة: {case.stage_display}   |   الحالة: {case.status}\n")
            self.detail_text.insert(tk.END, f"الموضوع: {case.subject}\n\n")
            self.detail_text.insert(tk.END, "📅 التواريخ:\n", "header")
            self.detail_text.insert(tk.END, f"تاريخ التسجيل: {case.date_register or 'غير محدد'}   |   أول جلسة: {case.first_session or 'غير محدد'}   |   المداولة: {case.delib_date or 'غير محدد'}\n\n")
            self.detail_text.insert(tk.END, "💰 الجانب المالي:\n", "header")
            self.detail_text.insert(tk.END, f"الأتعاب: {case.fees}   |   المدفوع: {case.paid}   |   ")
            rem_tag = "money" if case.remaining > 0 else ""
            self.detail_text.insert(tk.END, f"المتبقي: {case.remaining:g}\n\n", rem_tag)
            self.detail_text.insert(tk.END, "👥 الأطراف:\n", "header")
            self.detail_text.insert(tk.END, f"{case.parties_summary}\n")
        else: self.detail_text.insert("1.0", "لا توجد تفاصيل متاحة.")
        self.detail_text.config(state="disabled")

    def _setup_tab_case(self):
        t1 = tk.Frame(self.content_area, bg=AppConstants.COLORS["bg_main"])
        self._page_frames["case"] = t1
        scrollable = ScrollableFrame(t1, bg=AppConstants.COLORS["bg_main"]); scrollable.pack(fill="both", expand=True)
        body = scrollable.scrollable_frame
        right_frame = tk.Frame(body, bg=AppConstants.COLORS["bg_main"]); right_frame.pack(side="right", fill="both", expand=True, padx=8, pady=8)
        left_frame = tk.Frame(body, bg=AppConstants.COLORS["bg_main"]); left_frame.pack(side="left", fill="both", expand=True, padx=8, pady=8)
        self._setup_case_info_section(right_frame); self._setup_finance_section(right_frame); self._setup_notes_section(right_frame); self._setup_judgment_section(right_frame)
        self._setup_dates_section(left_frame); self._setup_delays_section(left_frame); self._setup_parties_section(left_frame)

    def _setup_case_info_section(self, parent):
        info_frame = self._create_section(parent, "البيانات الأساسية"); info_frame.pack(fill="x", pady=5)
        self._create_labeled_entry(info_frame, "اسم المحامي المكلف:", 0, "lawyer"); self.entries['lawyer'].insert(0, self.settings.lawyer_name)
        self._create_labeled_entry(info_frame, "المجلس:", 1, "council"); self._create_labeled_entry(info_frame, "المحكمة:", 2, "court")
        self._create_labeled_entry(info_frame, "القسم/الغرفة:", 3, "section")
        tk.Label(info_frame, text="طبيعة القضية:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_card"]).grid(row=4, column=2, sticky="e", padx=5, pady=5)
        self.entries['nature'] = ttk.Combobox(info_frame, values=AppConstants.CASE_NATURES, justify="right")
        self.entries['nature'].grid(row=4, column=1, sticky="we", padx=5, pady=5)
        self._create_labeled_entry(info_frame, "رقم القضية:", 5, "case_number"); self._create_labeled_entry(info_frame, "الموضوع:", 6, "subject")
        self._create_labeled_entry(info_frame, "هاتف قاعة المحامين:", 7, "bar_phone")
        stage_frame = tk.Frame(info_frame, bg=AppConstants.COLORS["bg_card"]); stage_frame.grid(row=8, column=0, columnspan=3, sticky="we", pady=5)
        tk.Label(stage_frame, text="مرحلة التقاضي:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_card"]).pack(side="right", padx=5)
        self.stage_var = tk.StringVar(value=AppConstants.STAGES[0])
        stage_cb = ttk.Combobox(stage_frame, textvariable=self.stage_var, values=AppConstants.STAGES, justify="right", state="readonly", width=25)
        stage_cb.pack(side="right", padx=5); stage_cb.bind("<<ComboboxSelected>>", self._on_stage_change)
        self.orig_case_label = tk.Label(stage_frame, text="", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_card"])
        self.entries['orig_case_num'] = RTLEntry(stage_frame, width=15)
        self.custom_stage_label = tk.Label(stage_frame, text="بيان المرحلة:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_card"])
        self.entries['custom_stage'] = RTLEntry(stage_frame, width=20)
        status_frame = tk.Frame(info_frame, bg=AppConstants.COLORS["bg_card"]); status_frame.grid(row=9, column=0, columnspan=3, sticky="we", pady=5)
        tk.Label(status_frame, text="حالة القضية:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_card"]).pack(side="right", padx=5)
        self.status_var = tk.StringVar(value=AppConstants.CASE_STATUSES[0])
        self.status_combobox = ttk.Combobox(status_frame, textvariable=self.status_var, values=AppConstants.CASE_STATUSES, justify="right", state="readonly", width=15)
        self.status_combobox.pack(side="right", padx=5); self.status_indicator = tk.Label(status_frame, text="⬤", font=("Segoe UI", 12), fg=AppConstants.COLORS["status_active"], bg=AppConstants.COLORS["bg_card"]); self.status_indicator.pack(side="right", padx=5)
        self.status_combobox.bind("<<ComboboxSelected>>", self._on_status_change); self._on_stage_change()

    def _setup_finance_section(self, parent):
        finance_frame = self._create_section(parent, "الجانب المالي والأتعاب"); finance_frame.pack(fill="x", pady=5)
        self._create_labeled_entry(finance_frame, "الأتعاب المتفق عليها:", 0, "fees"); self._create_labeled_entry(finance_frame, "المبلغ المدفوع:", 1, "paid"); self._create_labeled_entry(finance_frame, "المبلغ المتبقي:", 2, "remaining", state="readonly", fg=AppConstants.COLORS["text_remaining"])
        self.entries['fees'].bind("<KeyRelease>", self._calculate_remaining); self.entries['paid'].bind("<KeyRelease>", self._calculate_remaining)

    def _setup_notes_section(self, parent):
        notes_frame = self._create_section(parent, "📝 التفاصيل الإضافية"); notes_frame.pack(fill="x", pady=5)
        self.notes_text = tk.Text(notes_frame, height=3, wrap="word", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_input"], fg=AppConstants.COLORS["text_primary"], relief="solid", bd=1); self.notes_text.pack(fill="x", padx=5, pady=5)
        self.notes_text.bind("<KeyRelease>", lambda e: self._mark_dirty())

    def _setup_dates_section(self, parent):
        dates_frame = self._create_section(parent, "التواريخ الأساسية"); dates_frame.pack(fill="x", pady=5)
        self._create_labeled_date(dates_frame, "تاريخ التسجيل:", 0, "date_register"); self._create_labeled_date(dates_frame, "أول جلسة:", 1, "first_session"); self._create_labeled_date(dates_frame, "تاريخ المداولة:", 2, "delib_date")

    def _setup_delays_section(self, parent):
        self.delays_container = self._create_section(parent, "التأجيلات"); self.delays_container.pack(fill="x", pady=5)
        self._make_button(self.delays_container, "إضافة تأجيل", self._add_delay_row, bg=AppConstants.COLORS["info"], icon="➕").pack(pady=5)

    def _setup_parties_section(self, parent):
        self.parties_container = self._create_section(parent, "الأطراف"); self.parties_container.pack(fill="both", expand=True, pady=5)
        self._make_button(self.parties_container, "إضافة طرف", self._add_party_row, bg=AppConstants.COLORS["info"], icon="➕").pack(pady=5)

    def _setup_judgment_section(self, parent):
        judgement_frame = self._create_section(parent, "منطوق الحكم / القرار"); judgement_frame.pack(fill="both", expand=True, pady=5)
        self.judgment_text = tk.Text(judgement_frame, height=4, wrap="word", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_input"]); self.judgment_text.pack(fill="both", expand=True)

    def _setup_tab_operations(self):
        t2 = tk.Frame(self.content_area, bg=AppConstants.COLORS["bg_main"])
        self._page_frames["operations"] = t2

        scrollable = ScrollableFrame(t2, bg=AppConstants.COLORS["bg_main"])
        scrollable.pack(fill="both", expand=True, padx=20, pady=10)

        btn_frame = tk.Frame(scrollable.scrollable_frame, bg=AppConstants.COLORS["bg_main"])
        btn_frame.pack(pady=10, padx=50, fill="x", expand=True)

        buttons_config = [
            ("⚙️ إعدادات مكتب المحامي (الديباجة)", self._open_settings_dialog, AppConstants.COLORS["primary_light"]),
            ("📄 قضية جديدة إفراغ الحقول", self._new_case, AppConstants.COLORS["warning"]),
            ("💾 إنشاء وحفظ ملف جديد", self._create_file, AppConstants.COLORS["success"]),
            ("🔄 تحديث الملف المفتوح (Ctrl+S)", self._update_file, AppConstants.COLORS["primary_accent"]),
            ("📂 فتح مجلد القضية الحالي", self._open_current_case_folder, AppConstants.COLORS["info"]),
            ("📦 أرشفة القضية الحالية", self._archive_case, AppConstants.COLORS["purple"]),
            ("📊 احصاءات القضايا", self._show_statistics, AppConstants.COLORS["info"]),
            ("📤 تصدير جميع القضايا CSV", self._export_all_cases_csv, AppConstants.COLORS["secondary"]),
            ("📅 إضافة لتقويم جوجل", self._add_to_google_calendar, AppConstants.COLORS["danger"]),
            ("📎 إرفاق مستند", self._add_attachment, AppConstants.COLORS["primary"]),
            ("🖨️ طباعة تقرير القضية (HTML > PDF)", self._export_html_report, AppConstants.COLORS["info"]),
            ("📜 رسالة تأسيس (مدني/إداري)", self._open_civil_constitution_dialog, AppConstants.COLORS["warning"]),
            ("⚖️ رسالة تأسيس وطلبات (جزائي)", self._open_criminal_constitution_dialog, "#c0392b"),
            ("📊 تصدير الجلسات القادمة (HTML)", self._export_dashboard_html, AppConstants.COLORS["secondary"]),
            ("📋 استنساخ القضية", self._clone_case, AppConstants.COLORS["purple"]),
            ("🔐 أخذ نسخة احتياطية للقضايا", self._backup_database, AppConstants.COLORS["primary_light"]),
        ]
        
        if PDFReportBuilder.is_available(): 
            buttons_config.append(("📄 تصدير PDF", self._export_pdf_report, AppConstants.COLORS["primary"]))

        for text, command, bg in buttons_config:
            btn = self._make_button(btn_frame, text, command, bg=bg)
            btn.config(width=32, height=1)
            btn.pack(pady=6, fill="x")

    def _setup_tab_search(self):
        t3 = tk.Frame(self.content_area, padx=20, pady=20, bg=AppConstants.COLORS["bg_main"])
        self._page_frames["search"] = t3
        # Advanced filters frame
        filter_frame = tk.LabelFrame(t3, text="  🔽 فلاتر البحث المتقدم  ", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, "bold"), fg=AppConstants.COLORS["primary"], bg=AppConstants.COLORS["bg_card"], padx=10, pady=8, bd=1, relief="solid")
        filter_frame.pack(fill="x", pady=(0, 5))
        filters_row = tk.Frame(filter_frame, bg=AppConstants.COLORS["bg_card"])
        filters_row.pack(fill="x")
        tk.Label(filters_row, text="المحكمة:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), bg=AppConstants.COLORS["bg_card"], fg=AppConstants.COLORS["text_secondary"]).pack(side="right", padx=(5, 2))
        self.search_court_filter = ttk.Combobox(filters_row, values=[""], width=18, justify="right")
        self.search_court_filter.pack(side="right", padx=2)
        self.search_court_filter.set("")
        tk.Label(filters_row, text="الحالة:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), bg=AppConstants.COLORS["bg_card"], fg=AppConstants.COLORS["text_secondary"]).pack(side="right", padx=(10, 2))
        self.search_status_filter = ttk.Combobox(filters_row, values=[""] + AppConstants.CASE_STATUSES, width=12, justify="right")
        self.search_status_filter.pack(side="right", padx=2)
        self.search_status_filter.set("")
        tk.Label(filters_row, text="الطبيعة:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), bg=AppConstants.COLORS["bg_card"], fg=AppConstants.COLORS["text_secondary"]).pack(side="right", padx=(10, 2))
        self.search_nature_filter = ttk.Combobox(filters_row, values=[""] + AppConstants.CASE_NATURES, width=18, justify="right")
        self.search_nature_filter.pack(side="right", padx=2)
        self.search_nature_filter.set("")
        # Populate court filter dynamically when searching
        top_s = tk.Frame(t3, bg=AppConstants.COLORS["bg_main"]); top_s.pack(fill="x", pady=10)
        self._make_button(top_s, "بحث في الأرشيف", self._search, bg=AppConstants.COLORS["primary_accent"], icon="🔍").pack(side="right", padx=5)
        self._make_button(top_s, "عرض كل القضايا", self._show_all_cases, bg=AppConstants.COLORS["primary_light"], icon="📑").pack(side="right", padx=5)
        self.search_entry = RTLEntry(top_s, width=30); self.search_entry.pack(side="right", fill="x", expand=True, padx=5)
        self.search_entry.bind("<KeyRelease>", lambda e: self._mark_dirty()); self.search_entry.bind("<Return>", lambda e: self._search())
        
        self.search_results = tk.Listbox(t3, justify="right", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL))
        self.search_results.pack(fill="both", expand=True, pady=10); self.search_results.bind("<Double-Button-1>", self._load_from_listbox)

    def _setup_tab_archive(self):
        t4 = tk.Frame(self.content_area, padx=20, pady=20, bg=AppConstants.COLORS["bg_main"])
        self._page_frames["archive"] = t4
        btn_frame = tk.Frame(t4, bg=AppConstants.COLORS["bg_main"]); btn_frame.pack(fill="x", pady=5)
        self._make_button(btn_frame, "تحديث القائمة", self._load_cases, bg=AppConstants.COLORS["primary_accent"], icon="🔄").pack(side="right", padx=5)

        tk.Label(btn_frame, text="تصفية:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_main"]).pack(side="right", padx=(15, 5))
        self.archive_filter_var = tk.StringVar(value="الكل")
        filter_cb = ttk.Combobox(btn_frame, textvariable=self.archive_filter_var, values=["الكل"] + AppConstants.CASE_STATUSES, justify="right", state="readonly", width=12)
        filter_cb.pack(side="right", padx=5); filter_cb.bind("<<ComboboxSelected>>", lambda e: self._load_cases())

        columns = ("folder", "case_num", "court", "nature", "status")
        self.archive_tree = ttk.Treeview(t4, columns=columns, show="headings", height=20)
        for col, text in zip(columns, ["📁 المجلد", "🔢 رقم القضية", "🏛 المحكمة", "📋 الطبيعة", "⬤ الحالة"]):
            self.archive_tree.heading(col, text=text); self.archive_tree.column(col, anchor="center")
            
        self.archive_tree.tag_configure('جارية', foreground=AppConstants.COLORS["status_active"]); self.archive_tree.pack(fill="both", expand=True, pady=5)
        self.archive_tree.bind("<Double-Button-1>", self._load_from_archive_tree); self.archive_tree.bind("<Button-3>", self._open_folder_from_archive_tree)

    def _update_dashboard(self):
        for row in self.dash_tree.get_children(): self.dash_tree.delete(row)
        base_folder = self.settings.base_folder
        if not base_folder: return self.status_bar.set_warning("لم يتم اختيار مجلد القضايا")
        try:
            today = datetime.today().date(); sessions = CaseFileHandler.get_upcoming_sessions(base_folder, today); all_cases = CaseFileHandler.find_case_files(base_folder)
            urgent_count = 0
            for session in sessions:
                date_str = session["date"].strftime("%Y-%m-%d"); delta_days = (session["date"] - today).days; tag = 'urgent' if delta_days <= AppConstants.URGENT_DAYS_THRESHOLD else 'normal'
                if tag == 'urgent': urgent_count += 1
                self.dash_tree.insert("", tk.END, values=(date_str, session["case_number"], session["court"], session.get("nature", ""), session["reason"], session.get("parties_summary", "—"), session.get("status", ""), session["file_path"]), tags=(tag,))
            active_count = sum(1 for f in all_cases if CaseFileHandler.load_case(f) and CaseFileHandler.load_case(f).status == "جارية")
            self._update_stat_card("total", str(len(all_cases))); self._update_stat_card("active", str(active_count)); self._update_stat_card("upcoming", str(len(sessions))); self._update_stat_card("urgent", str(urgent_count))
        except Exception as e: logger.error(f"خطأ في تحديث لوحة المعلومات: {e}")

    def _update_stat_card(self, key: str, value: str):
        card = self.stat_cards.get(key)
        if card and card.winfo_exists() and card.winfo_children(): card.winfo_children()[0].config(text=value)

    def _open_case_from_dashboard(self, event):
        selected = self.dash_tree.selection()
        if selected:
            file_path = self.dash_tree.item(selected[0])['values'][7]
            if os.path.exists(str(file_path)): self._load_case_to_ui(str(file_path)); self._switch_page("case")

    def _calculate_remaining(self, event=None):
        try:
            fees = float(self.entries['fees'].get().strip() or 0.0); paid = float(self.entries['paid'].get().strip() or 0.0)
            self._set_readonly_entry('remaining', f"{fees - paid:g}")
        except ValueError: self._set_readonly_entry('remaining', "أرقام فقط")

    def _set_readonly_entry(self, key: str, value: str):
        self.entries[key].config(state="normal"); self.entries[key].delete(0, tk.END); self.entries[key].insert(0, value); self.entries[key].config(state="readonly")

    def _on_stage_change(self, event=None):
        stage = self.stage_var.get()
        self.orig_case_label.pack_forget(); self.entries['orig_case_num'].pack_forget()
        self.custom_stage_label.pack_forget(); self.entries['custom_stage'].pack_forget()

        if stage in AppConstants.STAGES_NEEDING_ORIG_CASE:
            label_text = "رقم القضية الأصلية:" if stage == "استئنافية" else ("رقم القضية الغيابية:" if stage == "معارضة" else "رقم القضية محل البراءة:")
            self.orig_case_label.config(text=label_text); self.orig_case_label.pack(side="right", padx=5); self.entries['orig_case_num'].pack(side="right", padx=5)
        else: self.entries['orig_case_num'].delete(0, tk.END)

        if stage == AppConstants.STAGE_NEEDING_CUSTOM:
            self.custom_stage_label.pack(side="right", padx=5); self.entries['custom_stage'].pack(side="right", padx=5)
        else: self.entries['custom_stage'].delete(0, tk.END)
        self._mark_dirty()

    def _on_status_change(self, event=None):
        status = self.status_var.get()
        color_map = {"جارية": AppConstants.COLORS["status_active"], "للجدولة": AppConstants.COLORS["status_scheduling"], "مفصول فيها": AppConstants.COLORS["status_decided"], "مؤرشفة": AppConstants.COLORS["status_archived"]}
        self.status_indicator.config(fg=color_map.get(status, AppConstants.COLORS["text_secondary"])); self._mark_dirty()

    def _open_settings_dialog(self):
        LawyerSettingsWindow(self.root, self.settings)

    def _new_case(self):
        if self._dirty and not messagebox.askyesno("تأكيد", "تعديلات غير محفوظة.\nهل تريد إفراغ الحقول لقضية جديدة؟"): return
        self._clear_ui(); self.current_file = ""; self._dirty = False; self.root.title(f"{AppConstants.APP_TITLE} - ملف جديد"); self._switch_page("case"); self.status_bar.set_message("ملف جديد")
        messagebox.showinfo("معلومة", "تم إفراغ الحقول لبدء تسجيل قضية جديدة.")

    def _archive_case(self):
        if not self.current_file:
            return messagebox.showwarning("تنبيه", "لا يوجد ملف مفتوح.")
        
        current_status = self.status_var.get()

        if current_status == "مؤرشفة":
            # حالة إلغاء الأرشفة
            if messagebox.askyesno("تأكيد", "هذه القضية مؤرشفة حالياً. هل تريد إلغاء الأرشفة وإعادتها كقضية جارية؟"):
                self.status_var.set("جارية")
                self._on_status_change()
                if self._update_file():
                    messagebox.showinfo("نجاح", "تم إلغاء أرشفة القضية بنجاح.")
        else:
            # حالة الأرشفة العادية
            if messagebox.askyesno("تأكيد", "هل أنت متأكد من أرشفة هذه القضية؟"):
                self.status_var.set("مؤرشفة")
                self._on_status_change()
                if self._update_file():
                    messagebox.showinfo("نجاح", "تمت أرشفة القضية بنجاح.")

    def _add_delay_row(self, delay: Optional[DelayEntry] = None):
        frame = tk.Frame(self.delays_container, pady=2, bg=AppConstants.COLORS["bg_card"]); frame.pack(fill="x", pady=2)
        tk.Button(frame, text="❌", font=("Segoe UI", 10), fg=AppConstants.COLORS["danger"], command=lambda: self._remove_delay_row(frame), relief="flat", cursor="hand2", bd=0, bg=AppConstants.COLORS["bg_card"]).pack(side="left", padx=5)
        if TKCALENDAR_AVAILABLE:
            date_entry = DateEntry(frame, width=12, date_pattern='yyyy-mm-dd', background=AppConstants.COLORS["primary"], foreground='white')
            date_entry.pack(side="right", padx=5); self._clear_date_entry(date_entry)
        else:
            date_entry = tk.Entry(frame, width=14); date_entry.insert(0, "yyyy-mm-dd"); date_entry.pack(side="right", padx=5)
        if delay and delay.date: self._set_date_value(date_entry, delay.date)
        tk.Label(frame, text="السبب:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_card"]).pack(side="right")
        reason_entry = RTLEntry(frame, width=25); reason_entry.pack(side="right", fill="x", expand=True, padx=5)
        if delay and delay.reason: reason_entry.insert(0, delay.reason)
        self.delays_widgets.append((date_entry, reason_entry, frame)); self._mark_dirty()

    def _remove_delay_row(self, frame: tk.Frame):
        frame.destroy(); self.delays_widgets = [(d, r, f) for d, r, f in self.delays_widgets if f is not frame and f.winfo_exists()]; self._mark_dirty()

    def _add_party_row(self, party: Optional[PartyEntry] = None):
        frame = tk.Frame(self.parties_container, bd=1, relief="solid", pady=5, padx=5, bg=AppConstants.COLORS["bg_card"], highlightbackground=AppConstants.COLORS["border_light"]); frame.pack(fill="x", pady=3)
        row1 = tk.Frame(frame, bg=AppConstants.COLORS["bg_card"]); row1.pack(fill="x")
        tk.Button(row1, text="❌", font=("Segoe UI", 10), fg=AppConstants.COLORS["danger"], command=lambda: self._remove_party_row(frame), relief="flat", cursor="hand2", bd=0, bg=AppConstants.COLORS["bg_card"]).pack(side="left", padx=5)
        role_cb = ttk.Combobox(row1, values=AppConstants.ROLES, justify="right", width=12); role_cb.pack(side="right", padx=2); role_cb.set(party.role if party else "المركز القانوني")
        name_entry = RTLEntry(row1, width=20); name_entry.pack(side="right", padx=2); name_entry.insert(0, party.name if party else "الاسم واللقب")
        phone_entry = RTLEntry(row1, width=15); phone_entry.pack(side="right", padx=2); phone_entry.insert(0, party.phone if party else "رقم الهاتف")
        self._make_button(row1, "واتساب", lambda: self._send_whatsapp(phone_entry.get()), bg=AppConstants.COLORS["success"], icon="💬").pack(side="right", padx=2)
        row2 = tk.Frame(frame, bg=AppConstants.COLORS["bg_card"]); row2.pack(fill="x", pady=3)
        tk.Label(row2, text="المحامي:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), bg=AppConstants.COLORS["bg_card"], fg=AppConstants.COLORS["text_secondary"]).pack(side="right", padx=2)
        lwyr_name = RTLEntry(row2, width=20); lwyr_name.pack(side="right", padx=2); lwyr_name.insert(0, party.lawyer_name if party else "")
        tk.Label(row2, text="هاتف المحامي:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_SMALL), bg=AppConstants.COLORS["bg_card"], fg=AppConstants.COLORS["text_secondary"]).pack(side="right", padx=2)
        lwyr_phone = RTLEntry(row2, width=15); lwyr_phone.pack(side="right", padx=2); lwyr_phone.insert(0, party.lawyer_phone if party else "")
        self.parties_widgets.append((role_cb, name_entry, phone_entry, lwyr_name, lwyr_phone, frame)); self._mark_dirty()

    def _remove_party_row(self, frame: tk.Frame):
        frame.destroy(); self.parties_widgets = [(r, n, p, ln, lp, f) for r, n, p, ln, lp, f in self.parties_widgets if f is not frame and f.winfo_exists()]; self._mark_dirty()

    def _clear_ui(self):
        for key, widget in self.entries.items():
            try:
                if isinstance(widget, RTLEntry): widget.config(state="normal"); widget.delete(0, tk.END)
                elif isinstance(widget, tk.Text): widget.config(state="normal"); widget.delete("1.0", tk.END)
                elif isinstance(widget, ttk.Combobox): widget.set('')
                elif TKCALENDAR_AVAILABLE and isinstance(widget, DateEntry): self._clear_date_entry(widget)
                elif isinstance(widget, tk.Entry): widget.delete(0, tk.END)
            except Exception: pass
        self.entries['remaining'].config(state="readonly")
        
        self.entries['lawyer'].insert(0, self.settings.lawyer_name)
        
        self.stage_var.set(AppConstants.STAGES[0]); self.status_var.set(AppConstants.CASE_STATUSES[0]); self._on_stage_change(); self._on_status_change()
        for widget_list in (self.delays_widgets, self.parties_widgets):
            for items in widget_list:
                try: items[-1].destroy()
                except tk.TclError: pass
            widget_list.clear()
        try: self.judgment_text.delete("1.0", tk.END); self.notes_text.delete("1.0", tk.END)
        except tk.TclError: pass

    def _ui_to_case_data(self) -> CaseData:
        delays = [DelayEntry(date=self._get_date_value(d), reason=r.get()) for d, r, f in self.delays_widgets if f.winfo_exists()]
        parties = [PartyEntry(role=r.get(), name=n.get(), phone=p.get(), lawyer_name=ln.get(), lawyer_phone=lp.get()) for r, n, p, ln, lp, f in self.parties_widgets if f.winfo_exists()]
        return CaseData(
            lawyer=self.entries['lawyer'].get(), council=self.entries['council'].get(), court=self.entries['court'].get(),
            section=self.entries['section'].get(), nature=self.entries['nature'].get(), case_number=self.entries['case_number'].get(),
            subject=self.entries['subject'].get(), bar_phone=self.entries['bar_phone'].get(), stage=self.stage_var.get(),
            orig_case_num=self.entries['orig_case_num'].get(), custom_stage=self.entries['custom_stage'].get(), status=self.status_var.get(),
            fees=self.entries['fees'].get(), paid=self.entries['paid'].get(), date_register=self._get_date_value(self.entries['date_register']),
            first_session=self._get_date_value(self.entries['first_session']), delib_date=self._get_date_value(self.entries['delib_date']),
            notes=self.notes_text.get("1.0", tk.END).strip(), delays=delays, parties=parties, judgment=self.judgment_text.get("1.0", tk.END).strip()
        )

    def _case_data_to_ui(self, case: CaseData):
        self._clear_ui()
        fields = {'lawyer': case.lawyer, 'council': case.council, 'court': case.court, 'section': case.section, 'case_number': case.case_number, 'subject': case.subject, 'bar_phone': case.bar_phone, 'orig_case_num': case.orig_case_num, 'fees': case.fees, 'paid': case.paid, 'custom_stage': case.custom_stage}
        for k, v in fields.items():
            if k in self.entries:
                self.entries[k].delete(0, tk.END)
                self.entries[k].insert(0, v)
                
        self.entries['nature'].set(case.nature); self.stage_var.set(case.stage); self._on_stage_change()
        if case.orig_case_num and case.stage in AppConstants.STAGES_NEEDING_ORIG_CASE: self.entries['orig_case_num'].delete(0, tk.END); self.entries['orig_case_num'].insert(0, case.orig_case_num)
        if case.custom_stage and case.stage == AppConstants.STAGE_NEEDING_CUSTOM: self.entries['custom_stage'].delete(0, tk.END); self.entries['custom_stage'].insert(0, case.custom_stage)
        self.status_var.set(case.status or AppConstants.CASE_STATUSES[0]); self._on_status_change()
        for k, v in {'date_register': case.date_register, 'first_session': case.first_session, 'delib_date': case.delib_date}.items():
            if v: self._set_date_value(self.entries[k], v)
        for d in case.delays: self._add_delay_row(d)
        for p in case.parties: self._add_party_row(p)
        if case.judgment: self.judgment_text.insert("1.0", case.judgment)
        if case.notes: self.notes_text.insert("1.0", case.notes)
        self._calculate_remaining(); self._dirty = False

    def _load_case_to_ui(self, file_path: str):
        case = CaseFileHandler.load_case(file_path)
        if case:
            self._case_data_to_ui(case); self.current_file = file_path; self._dirty = False
            self._switch_page("case"); self.root.title(f"{AppConstants.APP_TITLE} — {os.path.basename(os.path.dirname(file_path))}")

    def _validate_case_data(self, case: CaseData) -> bool:
        is_valid, msg = case.is_valid()
        if not is_valid: messagebox.showwarning("تنبيه", msg)
        return is_valid

    def _create_file(self) -> bool:
        case = self._ui_to_case_data()
        if not self._validate_case_data(case): return False
        # Duplicate detection
        base_folder = self.settings.base_folder
        if base_folder and os.path.exists(base_folder):
            for root_dir, _, _ in os.walk(base_folder):
                dir_name = os.path.basename(root_dir)
                safe_num = case.case_number.replace("/", "-").replace("\\", "-")
                if dir_name == f"قضية_{safe_num}":
                    if not messagebox.askyesno("كشف تكرار", f"رقم القضية موجود مسبقاً في المجلد:\n{root_dir}\n\nهل تريد المتابعة وإنشاء مجلد جديد؟"):
                        return False
                    break
        base_choice = filedialog.askdirectory(title="اختر المجلد", initialdir=self.settings.base_folder or "")
        if not base_choice: return False
        safe_num = case.case_number.replace("/", "-").replace("\\", "-")
        folder = os.path.join(base_choice, f"قضية_{safe_num}")
        try:
            self.current_file = CaseFileHandler.save_case(case, folder)
            self._dirty = False; messagebox.showinfo("نجاح", f"تم إنشاء ملف القضية وحفظه بنجاح."); self._load_cases()
            return True
        except OSError as e: messagebox.showerror("خطأ", f"فشل إنشاء الملف:\n{e}"); return False

    def _update_file(self) -> bool:
        if not self.current_file: return messagebox.showwarning("تنبيه", "لا يوجد ملف مفتوح لتحديثه.")
        case = self._ui_to_case_data()
        if not self._validate_case_data(case): return False
        try:
            CaseFileHandler.save_case(case, os.path.dirname(self.current_file))
            self._dirty = False; self.status_bar.set_success("تم تحديث الملف"); self._load_cases()
            messagebox.showinfo("نجاح", "تم تحديث بيانات القضية بنجاح.")
            return True
        except OSError as e: messagebox.showerror("خطأ", f"فشل تحديث الملف:\n{e}"); return False

    def _open_current_case_folder(self):
        if not self.current_file: return messagebox.showwarning("تنبيه", "الرجاء فتح ملف قضية أولاً.")
        PlatformHelper.open_folder_in_explorer(os.path.dirname(self.current_file))

    def _backup_database(self):
        base = self.settings.base_folder
        if not base: return messagebox.showwarning("تنبيه", "لم يتم اختيار مجلد رئيسي لأخذ نسخة احتياطية.")
        save_path = filedialog.asksaveasfilename(defaultextension=".zip", initialfile=f"backup_{datetime.now().strftime('%Y%m%d')}.zip", title="حفظ النسخة الاحتياطية", filetypes=[("ZIP files", "*.zip")])
        if save_path:
            try: shutil.make_archive(save_path.replace('.zip', ''), 'zip', base); messagebox.showinfo("نجاح", "تم إنشاء النسخة الاحتياطية (ZIP) بنجاح وحفظها.")
            except Exception as e: messagebox.showerror("خطأ", f"فشل النسخ الاحتياطي:\n{e}")

    def _export_dashboard_html(self):
        if not self.dash_tree.get_children(): return messagebox.showwarning("تنبيه", "لا توجد جلسات في اللوحة لتصديرها.")
        save_path = filedialog.asksaveasfilename(defaultextension=".html", initialfile=f"sessions_{datetime.now().strftime('%Y%m%d')}.html", title="تصدير جدول الجلسات (HTML)", filetypes=[("HTML files", "*.html")])
        if save_path:
            try:
                html_content = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>جدول الجلسات القادمة</title>
<style>body{{font-family:'Segoe UI',Tahoma,Arial,sans-serif;padding:20px;background-color:#f8f9fa;}} h2{{text-align:center;color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:10px;}} table{{width:100%;border-collapse:collapse;margin-top:20px;background-color:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);}} th{{background-color:#2c3e50;color:#fff;padding:12px;text-align:right;font-size:14px;border:1px solid #34495e;}} td{{border:1px solid #dfe6e9;padding:10px;font-size:13px;color:#333;}} tr:nth-child(even){{background-color:#fbfcfc;}} tr:hover{{background-color:#f1f2f6;}} .urgent{{background-color:#ffeaa7 !important;color:#d63031 !important;font-weight:bold;}} @media print{{body{{background-color:#fff;padding:0;}} table{{box-shadow:none;border:2px solid #000;}} *{{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}}}}</style>
</head><body><h2>جدول الجلسات القادمة - {self.settings.lawyer_name}</h2>
<table><thead><tr><th>التاريخ</th><th>رقم القضية</th><th>المحكمة</th><th>الطبيعة</th><th>البيان</th><th>الأطراف</th><th>الحالة</th></tr></thead><tbody>"""
                for row_id in self.dash_tree.get_children():
                    values = self.dash_tree.item(row_id)['values']; tags = self.dash_tree.item(row_id)['tags']; row_class = "urgent" if "urgent" in tags else ""
                    html_content += f'<tr class="{row_class}"><td>{values[0]}</td><td>{values[1]}</td><td>{values[2]}</td><td>{values[3]}</td><td>{values[4]}</td><td>{values[5]}</td><td>{values[6]}</td></tr>'
                html_content += f"""</tbody></table><div style="text-align: center; margin-top: 20px; font-size: 12px; color: #7f8c8d;">تم التصدير يوم: {datetime.now().strftime("%Y-%m-%d %H:%M")}</div></body></html>"""
                with open(save_path, 'w', encoding='utf-8') as f: f.write(html_content)
                webbrowser.open(f"file://{save_path}"); messagebox.showinfo("نجاح", "تم تصدير وفتح جدول الجلسات (HTML) بنجاح.")
            except Exception as e: messagebox.showerror("خطأ", f"فشل التصدير:\n{e}")

    def _open_civil_constitution_dialog(self):
        case = self._ui_to_case_data()
        if not case.case_number or not case.court:
            return messagebox.showwarning("تنبيه", "يرجى إدخال 'المحكمة' و 'رقم القضية' أولاً.")

        dialog = tk.Toplevel(self.root)
        dialog.title("إنشاء رسالة تأسيس (مدني/إداري)")
        dialog.geometry("600x500")
        dialog.configure(bg=AppConstants.COLORS["bg_main"])
        dialog.transient(self.root); dialog.grab_set()

        frame_court = tk.LabelFrame(dialog, text=" الجهة القضائية والتوجيه ", font=(AppConstants.FONT_FAMILY, 11, 'bold'), bg="white", padx=10, pady=10)
        frame_court.pack(fill="x", padx=15, pady=10)
        tk.Label(frame_court, text="إلى السيد(ة):", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white").grid(row=0, column=1, sticky="e", pady=5)
        to_whom_var = tk.StringVar(value=f"الرئيس الفاصل في قضايا {case.section or 'المدني'}")
        tk.Entry(frame_court, textvariable=to_whom_var, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), width=40, justify="right").grid(row=0, column=0, sticky="we", padx=5)

        frame_client = tk.LabelFrame(dialog, text=" الأطراف (اختر موكلك) ", font=(AppConstants.FONT_FAMILY, 11, 'bold'), bg="white", padx=10, pady=10)
        frame_client.pack(fill="both", expand=True, padx=15, pady=5)
        tk.Label(frame_client, text="لفائدة (الرجاء تحديد موكليك من القائمة):", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white", fg=AppConstants.COLORS["primary"]).pack(anchor="e", pady=(0, 10))
        
        party_vars = []
        for p in case.parties:
            var = tk.BooleanVar(value=False)
            text = f"{p.role}: {p.name}" + (f" (هاتف: {p.phone})" if p.phone else "")
            tk.Checkbutton(frame_client, text=text, variable=var, bg="white", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL)).pack(anchor="e", pady=2)
            party_vars.append((p, var))

        def submit():
            selected_clients = [p for p, var in party_vars if var.get()]
            self._generate_civil_html(case, to_whom_var.get(), case.court, selected_clients)
            dialog.destroy()

        self._make_button(dialog, "📄 إنشاء رسالة التأسيس", submit, bg=AppConstants.COLORS["warning"]).pack(fill="x", padx=15, pady=15)

    def _generate_civil_html(self, case, to_whom, court_name, selected_clients):
        client_names = " و ".join([f"{p.name} (بصفته: {p.role})" for p in selected_clients]) if selected_clients else "........................................."
        
        other_parties_html = ""
        other_parties = [p for p in case.parties if p not in selected_clients]
        for p in other_parties:
            other_parties_html += f"<tr><td style='width: 150px;'>{p.role}:</td><td>{p.name}</td></tr>\n"
        if not other_parties:
            other_parties_html = "<tr><td style='width: 150px;'>ضد:</td><td>.........................................</td></tr>\n"

        html_content = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>رسالة تأسيس - {case.case_number}</title>
    <style>
        @page {{ size: A4; margin: 2cm; }}
        body {{ font-family: 'Segoe UI', 'Arial', Tahoma, sans-serif; font-size: 18px; line-height: 1.8; color: #000; padding: 20px; }}
        .header-info {{ font-weight: bold; margin-bottom: 30px; font-size: 18px; display: flex; justify-content: space-between; }}
        .header-right {{ width: 50%; }} .header-left {{ width: 50%; text-align: left; }}
        .title {{ text-align: center; font-size: 26px; font-weight: bold; margin: 30px 0; text-decoration: underline; }}
        .content-box {{ margin-bottom: 30px; font-size: 19px; }}
        .list-items {{ margin-top: 20px; }}
        .footer {{ text-align: left; margin-top: 60px; font-weight: bold; font-size: 20px; padding-left: 50px; }}
        @media print {{ body {{ padding: 0; }} * {{ -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }} }}
    </style>
</head>
<body>
    <div style="text-align: center !important; display: block; width: 100%; margin-bottom: 20px; border: 2px solid #2c3e50; padding: 10px; border-radius: 8px;">
        <h2 style="margin: 0; color: #2c3e50; font-size: 24px; text-align: center !important; display: block; width: 100%;">{self.settings.lawyer_name}</h2>
        <div style="font-size: 16px; font-weight: bold; color: #2c3e50; text-align: center !important; display: block; width: 100%;">{self.settings.lawyer_title}</div>
        <div style="font-size: 14px; font-weight: bold; text-align: center !important; display: block; width: 100%;">{self.settings.lawyer_address} | هاتف: {self.settings.lawyer_phone}</div>
    </div>

    <div class="header-info">
        <div class="header-right">مجلس قضاء: {case.council or '..................'}<br>محكمة: {case.court}<br>قسم/غرفة: {case.section or '..................'}</div>
        <div class="header-left">قضية رقم: <span dir="ltr" style="display: inline-block;">{case.case_number}</span><br>جلسة: {case.first_session or '......./......./202...'}</div>
    </div>
    
    <div class="content-box" style="text-align: center; font-size: 22px;">
        <strong>إلى السيد(ة) {to_whom}</strong><br><strong>لدى محكمة {court_name}</strong>
    </div>

    <div class="title">الموضوع : رسالة تأسيس</div>
    
    <div class="content-box">
        <table style="width: 100%; font-size: 19px; font-weight: bold; margin-bottom: 15px;">
            <tr><td colspan="2" style="color: #2c3e50; text-decoration: underline; padding-bottom: 10px;">أطراف القضية:</td></tr>
            <tr><td style="width: 150px; vertical-align: top;">لفائدة:</td><td>{client_names}</td></tr>
            {other_parties_html}
        </table>
    </div>
    <div class="list-items">
        <ul style="list-style-type: disc;">
            <li style="margin-bottom: 10px;">يشرفني أن أعلمكم بأننا وكلنا من طرف <strong>المذكور(ين) أعلاه في خانة (لفائدة)</strong> لتمثيلهم في القضية الحالية.</li>
            <li>لذا يرجى من عدالتكم الموقرة وسيادتكم المحترمة، الأخذ بعين الاعتبار تأسسنا هذا.</li>
        </ul>
    </div>
    <div style="text-align: center; font-weight: bold; margin-top: 40px; font-size: 19px;">تقبلوا منا أسمى عبارات التقدير والاحترام</div>
    <div class="footer">المحامي: {case.lawyer}</div>
</body>
</html>"""
        safe_num = case.case_number.replace("/", "-").replace("\\", "-")
        report_path = os.path.join(LOG_DIR, f"Constitution_{safe_num}.html")
        try:
            with open(report_path, "w", encoding="utf-8") as f: f.write(html_content)
            webbrowser.open(f"file://{report_path}"); messagebox.showinfo("نجاح", "تم إنشاء رسالة التأسيس بنجاح وفتحها للطباعة.")
        except Exception as e: messagebox.showerror("خطأ", f"تعذر إنشاء رسالة التأسيس:\n{e}")

    def _open_criminal_constitution_dialog(self):
        case = self._ui_to_case_data()
        if not case.case_number or not case.court:
            return messagebox.showwarning("تنبيه", "يرجى إدخال 'المحكمة' و 'رقم القضية' أولاً.")

        dialog = tk.Toplevel(self.root)
        dialog.title("إنشاء رسالة تأسيس وطلبات (الجزائي)")
        dialog.geometry("650x650")
        dialog.configure(bg=AppConstants.COLORS["bg_main"])
        dialog.transient(self.root); dialog.grab_set()

        frame_court = tk.LabelFrame(dialog, text=" الجهة القضائية والتوجيه ", font=(AppConstants.FONT_FAMILY, 11, 'bold'), bg="white", padx=10, pady=10)
        frame_court.pack(fill="x", padx=15, pady=10)
        tk.Label(frame_court, text="إلى السيد(ة):", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white").grid(row=0, column=1, sticky="e", pady=5)
        to_whom_var = tk.StringVar(value="الرئيس الفاصل في قضايا الجنح")
        tk.Entry(frame_court, textvariable=to_whom_var, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), width=40, justify="right").grid(row=0, column=0, sticky="we", padx=5)
        tk.Label(frame_court, text="لدى محكمة:", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white").grid(row=1, column=1, sticky="e", pady=5)
        court_var = tk.StringVar(value=case.court)
        tk.Entry(frame_court, textvariable=court_var, font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), width=40, justify="right").grid(row=1, column=0, sticky="we", padx=5)

        frame_client = tk.LabelFrame(dialog, text=" الأطراف (اختر موكلك) والصفة ", font=(AppConstants.FONT_FAMILY, 11, 'bold'), bg="white", padx=10, pady=10)
        frame_client.pack(fill="both", expand=True, padx=15, pady=5)
        tk.Label(frame_client, text="لفائدة (الرجاء تحديد موكليك من القائمة):", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg="white", fg=AppConstants.COLORS["primary"]).pack(anchor="e", pady=(0, 5))
        
        party_vars = []
        for p in case.parties:
            var = tk.BooleanVar(value=False)
            text = f"{p.role}: {p.name}" + (f" (هاتف: {p.phone})" if p.phone else "")
            tk.Checkbutton(frame_client, text=text, variable=var, bg="white", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL)).pack(anchor="e")
            party_vars.append((p, var))

        tk.Frame(frame_client, height=1, bg=AppConstants.COLORS["border_light"]).pack(fill="x", pady=10)
        
        status_var = tk.StringVar(value="متهم غير موقوف")
        status_frame = tk.Frame(frame_client, bg="white"); status_frame.pack(fill="x")
        tk.Radiobutton(status_frame, text="طرف مدني", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), variable=status_var, value="طرف مدني", bg="white").pack(side="left", expand=True)
        tk.Radiobutton(status_frame, text="متهم موقوف", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), variable=status_var, value="متهم موقوف", bg="white").pack(side="left", expand=True)
        tk.Radiobutton(status_frame, text="متهم غير موقوف", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), variable=status_var, value="متهم غير موقوف", bg="white").pack(side="left", expand=True)

        frame_requests = tk.LabelFrame(dialog, text=" الطلبات ", font=(AppConstants.FONT_FAMILY, 11, 'bold'), bg="white", padx=10, pady=10)
        frame_requests.pack(fill="both", expand=True, padx=15, pady=5)
        req_view = tk.BooleanVar(value=True); req_copy = tk.BooleanVar(value=False); req_visit = tk.BooleanVar(value=False)
        tk.Checkbutton(frame_requests, text="تمكيننا من الإطلاع على نسخة كاملة من ملف القضية", variable=req_view, bg="white", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL)).pack(anchor="e", pady=5)
        tk.Checkbutton(frame_requests, text="تمكيننا من نسخة كاملة من ملف القضية", variable=req_copy, bg="white", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL)).pack(anchor="e", pady=5)
        tk.Checkbutton(frame_requests, text="تسليمنا رخصة للإتصال بموكلنا بمؤسسة إعادة التربية", variable=req_visit, bg="white", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL)).pack(anchor="e", pady=5)

        def on_status_change(*args): req_visit.set(True if status_var.get() == "متهم موقوف" else False)
        status_var.trace_add("write", on_status_change)

        def submit():
            selected_clients = [p for p, var in party_vars if var.get()]
            self._generate_criminal_html(case, to_whom_var.get(), court_var.get(), selected_clients, status_var.get(), req_view.get(), req_copy.get(), req_visit.get())
            dialog.destroy()

        self._make_button(dialog, "📄 إنشاء رسالة التأسيس", submit, bg="#c0392b").pack(fill="x", padx=15, pady=15)

    def _generate_criminal_html(self, case, to_whom, court_name, selected_clients, client_status, r_view, r_copy, r_visit):
        client_names = " و ".join([p.name for p in selected_clients]) if selected_clients else "........................................."
        
        other_parties_html = ""
        other_parties = [p for p in case.parties if p not in selected_clients]
        for p in other_parties:
            other_parties_html += f"<tr><td style='width: 150px;'>{p.role}:</td><td>{p.name}</td></tr>\n"
        if not other_parties:
            other_parties_html = "<tr><td style='width: 150px;'>ضد:</td><td>.........................................</td></tr>\n"

        requests_html = ""
        if r_view: requests_html += "<li>تمكيننا من الإطلاع على نسخة كاملة من ملف القضية.</li>\n"
        if r_copy: requests_html += "<li>تمكيننا من الحصول على نسخة كاملة من ملف القضية.</li>\n"
        if r_visit: requests_html += f"<li>تسليمنا رخصة للإتصال بموكلنا <strong>({client_names})</strong> بمؤسسة إعادة التربية.</li>\n"
        if not requests_html: requests_html = "<li>تأسيسنا في حق الموكل المذكور أعلاه للدفاع عن مصالحه.</li>"

        html_content = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>رسالة تأسيس جزائي - {case.case_number}</title>
    <style>
        @page {{ size: A4; margin: 2cm; }}
        body {{ font-family: 'Segoe UI', 'Arial', Tahoma, sans-serif; font-size: 18px; line-height: 1.8; color: #000; padding: 20px; }}
        .header-info {{ font-weight: bold; margin-bottom: 30px; font-size: 18px; display: flex; justify-content: space-between; }}
        .header-right {{ width: 50%; }} .header-left {{ width: 50%; text-align: left; }}
        .title {{ text-align: center; font-size: 26px; font-weight: bold; margin: 30px 0; text-decoration: underline; }}
        .content-box {{ margin-bottom: 30px; font-size: 19px; }}
        .list-items {{ margin-top: 20px; font-weight: bold; }} .list-items ul {{ line-height: 2.2; }}
        .footer {{ text-align: left; margin-top: 60px; font-weight: bold; font-size: 20px; padding-left: 50px; }}
        @media print {{ body {{ padding: 0; }} * {{ -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }} }}
    </style>
</head>
<body>
    <div style="text-align: center !important; display: block; width: 100%; margin-bottom: 20px; border: 2px solid #2c3e50; padding: 10px; border-radius: 8px;">
        <h2 style="margin: 0; color: #2c3e50; font-size: 24px; text-align: center !important; display: block; width: 100%;">{self.settings.lawyer_name}</h2>
        <div style="font-size: 16px; font-weight: bold; color: #2c3e50; text-align: center !important; display: block; width: 100%;">{self.settings.lawyer_title}</div>
        <div style="font-size: 14px; font-weight: bold; text-align: center !important; display: block; width: 100%;">{self.settings.lawyer_address} | هاتف: {self.settings.lawyer_phone}</div>
    </div>

    <div class="header-info">
        <div class="header-right">مجلس قضاء: {case.council or '..................'}<br>محكمة: {case.court}<br>قسم/غرفة: {case.section or 'الجنح'}</div>
        <div class="header-left">قضية رقم: <span dir="ltr" style="display: inline-block;">{case.case_number}</span><br>تاريخ الجلسة: {case.first_session or '......./......./202...'}</div>
    </div>
    <div class="content-box" style="text-align: center; font-size: 22px;">
        <strong>إلى السيد(ة): {to_whom}</strong><br><strong>لدى محكمة: {court_name}</strong>
    </div>
    <div class="title">الموضوع : رسالة تأسيس</div>
    <div class="content-box">
        <table style="width: 100%; font-size: 19px; font-weight: bold;">
            <tr><td colspan="2" style="color: #2c3e50; text-decoration: underline; padding-bottom: 10px;">أطراف القضية:</td></tr>
            <tr><td style="width: 150px; vertical-align: top;">لفائدة:</td><td>{client_names} (الصفة: {client_status})</td></tr>
            {other_parties_html}
            <tr><td style="width: 150px;">بحضور:</td><td>النيابة العامة و من معها</td></tr>
        </table>
    </div>
    <div style="font-size: 19px;">
        <strong>سيادة {to_whom.replace('السيد', '').replace('السيدة', '').strip()} المحترم(ة)،</strong><br>
        يشرفني أن أعلمكم بأننا وكلنا من طرف المذكور أعلاه لتمثيله والدفاع عن حقوقه في قضية الحال.<br>
        وعليه، نلتمس من عدالتكم الموقرة الموافقة على الطلبات التالية:
    </div>
    <div class="list-items">
        <ul style="list-style-type: square;">{requests_html}</ul>
    </div>
    <div style="text-align: center; font-weight: bold; margin-top: 40px; font-size: 19px;">تقبلوا منا أسمى عبارات التقدير والاحترام</div>
    <div class="footer">المحامي: {case.lawyer}</div>
</body>
</html>"""
        safe_num = case.case_number.replace("/", "-").replace("\\", "-")
        report_path = os.path.join(LOG_DIR, f"Criminal_Constitution_{safe_num}.html")
        try:
            with open(report_path, "w", encoding="utf-8") as f: f.write(html_content)
            webbrowser.open(f"file://{report_path}"); messagebox.showinfo("نجاح", "تم إنشاء رسالة التأسيس والطلبات (الجزائي) بنجاح وفتحها للطباعة.")
        except Exception as e: messagebox.showerror("خطأ", f"تعذر إنشاء الرسالة:\n{e}")


    # ─── CHANGE 6: Case Cloning ───
    def _clone_case(self):
        case = self._ui_to_case_data()
        new_num = simpledialog.askstring("استنساخ القضية", "أدخل رقم القضية الجديد:", parent=self.root)
        if not new_num or not new_num.strip():
            return
        case.case_number = new_num.strip()
        self._case_data_to_ui(case)
        self.current_file = ""
        self._dirty = True
        self.root.title(f"{AppConstants.APP_TITLE} - استنساخ: {new_num.strip()}")
        self.status_bar.set_warning("بيانات مستنسخة — يرجى المراجعة والحفظ")
        messagebox.showinfo("استنساخ", f"تم نسخ بيانات القضية برقم جديد: {new_num.strip()}\nيرجى المراجعة ثم الحفظ يدوياً.")

    # ─── CHANGE 5: Calendar View ───
    def _setup_tab_calendar(self):
        t5 = tk.Frame(self.content_area, padx=15, pady=15, bg=AppConstants.COLORS["bg_main"])
        self._page_frames["calendar"] = t5
        # Navigation
        nav_frame = tk.Frame(t5, bg=AppConstants.COLORS["bg_main"])
        nav_frame.pack(fill="x", pady=(0, 10))
        self.cal_year = datetime.today().year
        self.cal_month = datetime.today().month
        self.cal_month_names = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                                "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
        self.cal_prev_btn = self._make_button(nav_frame, "◀ الشهر السابق", self._cal_prev_month, bg=AppConstants.COLORS["primary_light"], icon="")
        self.cal_prev_btn.pack(side="right", padx=5)
        self.cal_title_label = tk.Label(nav_frame, text="", font=(AppConstants.FONT_FAMILY, 14, "bold"), bg=AppConstants.COLORS["bg_main"], fg=AppConstants.COLORS["primary"])
        self.cal_title_label.pack(side="right", padx=15, expand=True)
        self.cal_next_btn = self._make_button(nav_frame, "الشهر التالي ▶", self._cal_next_month, bg=AppConstants.COLORS["primary_light"], icon="")
        self.cal_next_btn.pack(side="right", padx=5)
        # Calendar canvas
        self.cal_canvas = tk.Canvas(t5, bg=AppConstants.COLORS["bg_card"], highlightthickness=0, height=380)
        self.cal_canvas.pack(fill="x", pady=5)
        self.cal_canvas.bind("<Button-1>", self._cal_on_click)
        # Sessions detail
        detail_frame = tk.LabelFrame(t5, text="  📅 جلسات اليوم المحدد  ", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, "bold"), fg=AppConstants.COLORS["primary"], bg=AppConstants.COLORS["bg_card"], padx=10, pady=8, bd=1, relief="solid")
        detail_frame.pack(fill="both", expand=True, pady=(10, 0))
        self.cal_detail_text = tk.Text(detail_frame, height=6, wrap="word", font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL), bg=AppConstants.COLORS["bg_input"], fg=AppConstants.COLORS["text_primary"], relief="flat", state="disabled")
        self.cal_detail_text.pack(fill="both", expand=True)
        self.cal_detail_text.tag_configure("header", foreground=AppConstants.COLORS["primary_accent"], font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, "bold"))
        self.cal_detail_text.tag_configure("urgent", foreground=AppConstants.COLORS["danger"], font=(AppConstants.FONT_FAMILY, AppConstants.FONT_SIZE_NORMAL, "bold"))
        # Initial draw
        self._cal_draw()

    def _cal_prev_month(self):
        self.cal_month -= 1
        if self.cal_month < 1:
            self.cal_month = 12; self.cal_year -= 1
        self._cal_draw()

    def _cal_next_month(self):
        self.cal_month += 1
        if self.cal_month > 12:
            self.cal_month = 1; self.cal_year += 1
        self._cal_draw()

    def _cal_draw(self):
        self.cal_canvas.delete("all")
        month_name = self.cal_month_names[self.cal_month - 1]
        self.cal_title_label.config(text=f"{month_name} {self.cal_year}")
        # Get sessions for this month
        base_folder = self.settings.base_folder
        sessions = CaseFileHandler.get_all_sessions(base_folder, self.cal_year, self.cal_month) if base_folder else []
        session_dates = {}
        for s in sessions:
            d = s["date"].day
            if d not in session_dates:
                session_dates[d] = []
            session_dates[d].append(s)
        # Calendar layout
        w = self.cal_canvas.winfo_width() or 700
        cell_w = w / 7
        cell_h = 50
        header_h = 30
        day_names = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
        # Draw header
        for i, dn in enumerate(day_names):
            x = i * cell_w + cell_w / 2
            self.cal_canvas.create_text(x, header_h / 2, text=dn, font=(AppConstants.FONT_FAMILY, 10, "bold"), fill=AppConstants.COLORS["text_secondary"])
        # Draw days
        first_day_weekday = cal_module.monthrange(self.cal_year, self.cal_month)[0]
        days_in_month = cal_module.monthrange(self.cal_year, self.cal_month)[1]
        today = datetime.today().date()
        row, col = 0, first_day_weekday
        for day in range(1, days_in_month + 1):
            x1 = col * cell_w + 2
            y1 = header_h + row * cell_h + 2
            x2 = (col + 1) * cell_w - 2
            y2 = header_h + (row + 1) * cell_h - 2
            is_today = (date(self.cal_year, self.cal_month, day) == today)
            fill = "#eaf2f8" if is_today else AppConstants.COLORS["bg_card"]
            outline = AppConstants.COLORS["primary_accent"] if is_today else AppConstants.COLORS["border_light"]
            self.cal_canvas.create_rectangle(x1, y1, x2, y2, fill=fill, outline=outline, width=1, tags=f"day_{day}")
            # Day number
            cx = (x1 + x2) / 2
            cy = y1 + 15
            fg = AppConstants.COLORS["primary_accent"] if is_today else AppConstants.COLORS["text_primary"]
            self.cal_canvas.create_text(cx, cy, text=str(day), font=(AppConstants.FONT_FAMILY, 10), fill=fg)
            # Session dots
            if day in session_dates:
                dot_y = y2 - 12
                num_sessions = len(session_dates[day])
                dot_x_start = cx - (num_sessions - 1) * 5
                for si in range(min(num_sessions, 4)):
                    s = session_dates[day][si]
                    dot_color = s.get("status_color", AppConstants.COLORS["primary_accent"])
                    dx = dot_x_start + si * 10
                    self.cal_canvas.create_oval(dx - 3, dot_y - 3, dx + 3, dot_y + 3, fill=dot_color, outline="")
            col += 1
            if col > 6:
                col = 0; row += 1
        # Store session data
        self._cal_session_dates = session_dates
        total_height = header_h + (row + 1) * cell_h + 5
        self.cal_canvas.config(height=max(total_height, 380))

    def _cal_on_click(self, event):
        base_folder = self.settings.base_folder
        if not base_folder:
            return
        # Determine which day was clicked
        w = self.cal_canvas.winfo_width() or 700
        cell_w = w / 7
        cell_h = 50
        header_h = 30
        col = int(event.x / cell_w)
        row = int((event.y - header_h) / cell_h)
        if row < 0 or col < 0 or col > 6:
            return
        first_day_weekday = cal_module.monthrange(self.cal_year, self.cal_month)[0]
        days_in_month = cal_module.monthrange(self.cal_year, self.cal_month)[1]
        day_num = row * 7 + col - first_day_weekday + 1
        if day_num < 1 or day_num > days_in_month:
            self.cal_detail_text.config(state="normal")
            self.cal_detail_text.delete("1.0", tk.END)
            self.cal_detail_text.insert("1.0", "لا توجد جلسات في هذا اليوم.")
            self.cal_detail_text.config(state="disabled")
            return
        sessions = CaseFileHandler.get_all_sessions(base_folder, self.cal_year, self.cal_month)
        day_sessions = [s for s in sessions if s["date"].day == day_num]
        self.cal_detail_text.config(state="normal")
        self.cal_detail_text.delete("1.0", tk.END)
        if day_sessions:
            self.cal_detail_text.insert(tk.END, f"📅 جلسات يوم {self.cal_year}-{self.cal_month:02d}-{day_num:02d}:\n\n", "header")
            for s in day_sessions:
                tag = "urgent" if (s["date"] - datetime.today().date()).days <= 3 and (s["date"] - datetime.today().date()).days >= 0 else ""
                self.cal_detail_text.insert(tk.END, f"🔢 {s['case_number']} | {s['court']}\n", tag)
                self.cal_detail_text.insert(tk.END, f"   {s['reason']}\n")
                self.cal_detail_text.insert(tk.END, f"   الموضوع: {s.get('subject', '')}\n\n")
        else:
            self.cal_detail_text.insert("1.0", f"لا توجد جلسات مسجلة يوم {self.cal_year}-{self.cal_month:02d}-{day_num:02d}.")
        self.cal_detail_text.config(state="disabled")

    # ─── بقية الدوال ───
    def _search(self):
        if not self.settings.base_folder: return messagebox.showwarning("تنبيه", "اختر المجلد الرئيسي أولاً.")
        # Update court filter values from existing cases
        if not self.search_court_filter.get():
            courts = set()
            for fp in CaseFileHandler.find_case_files(self.settings.base_folder):
                c = CaseFileHandler.load_case(fp)
                if c and c.court: courts.add(c.court)
            self.search_court_filter['values'] = [""] + sorted(list(courts))
        court_f = self.search_court_filter.get() if hasattr(self, 'search_court_filter') else ""
        status_f = self.search_status_filter.get() if hasattr(self, 'search_status_filter') else ""
        nature_f = self.search_nature_filter.get() if hasattr(self, 'search_nature_filter') else ""
        results = CaseFileHandler.search_cases(self.settings.base_folder, self.search_entry.get(), court_filter=court_f, status_filter=status_f, nature_filter=nature_f)
        self.search_results.delete(0, tk.END)
        for path in results: self.search_results.insert(tk.END, path)
        if not results: messagebox.showinfo("معلومة", "لا توجد نتائج مطابقة لبحثك.")

    def _show_all_cases(self):
        if not self.settings.base_folder: return messagebox.showwarning("تنبيه", "اختر المجلد الرئيسي أولاً.")
        case_files = CaseFileHandler.find_case_files(self.settings.base_folder)
        self.search_results.delete(0, tk.END)
        for path in case_files: self.search_results.insert(tk.END, path)

    def _load_cases(self):
        if not self.settings.base_folder: return
        for row in self.archive_tree.get_children(): self.archive_tree.delete(row)
        filter_status = self.archive_filter_var.get()
        try:
            for root_dir, _, files in os.walk(self.settings.base_folder):
                if AppConstants.CASE_INFO_FILE in files:
                    file_path = os.path.join(root_dir, AppConstants.CASE_INFO_FILE)
                    case = CaseFileHandler.load_case(file_path)
                    if case:
                        status = case.status or "جارية"
                        if filter_status == "الكل" or status == filter_status:
                            self.archive_tree.insert("", tk.END, values=(os.path.basename(root_dir), case.case_number, case.court, case.nature, status), tags=(status,))
        except Exception as e: logger.error(f"خطأ في التحميل: {e}")
        self._update_dashboard()

    def _load_from_archive_tree(self, event):
        selected = self.archive_tree.selection()
        if selected:
            folder_name = self.archive_tree.item(selected[0])['values'][0]
            for root_dir, _, files in os.walk(self.settings.base_folder):
                if os.path.basename(root_dir) == str(folder_name) and AppConstants.CASE_INFO_FILE in files:
                    self._load_case_to_ui(os.path.join(root_dir, AppConstants.CASE_INFO_FILE))
                    return

    def _open_folder_from_archive_tree(self, event):
        item_id = self.archive_tree.identify_row(event.y)
        if item_id:
            folder_name = self.archive_tree.item(item_id)['values'][0]
            for root_dir, _, _ in os.walk(self.settings.base_folder):
                if os.path.basename(root_dir) == str(folder_name):
                    PlatformHelper.open_folder_in_explorer(root_dir)
                    return

    def _load_from_listbox(self, event):
        selection = event.widget.curselection()
        if selection:
            item = event.widget.get(selection[0])
            path = item if item.endswith(".txt") else os.path.join(item, AppConstants.CASE_INFO_FILE)
            if os.path.exists(path): self._load_case_to_ui(path)

    def _choose_folder(self):
        folder = filedialog.askdirectory(initialdir=self.settings.base_folder or "")
        if folder: self._on_folder_selected(folder)

    def _on_folder_selected(self, folder: str):
        self.settings.base_folder = folder
        self.folder_label.config(text=folder)
        CaseFileHandler.clear_cache(); self._load_cases()
        self._hide_welcome()
        messagebox.showinfo("نجاح", "تم تغيير المجلد الرئيسي بنجاح.")

    def _send_whatsapp(self, phone_number: str):
        digits = "".join(filter(str.isdigit, phone_number))
        if len(digits) < 9: return messagebox.showwarning("تنبيه", "رقم غير صالح.")
        if digits.startswith("0"): digits = AppConstants.DEFAULT_COUNTRY_CODE + digits[1:]
        msg = f"مرحباً، نعلمكم بمستجدات قضيتكم رقم ({self.entries.get('case_number').get()}) بمحكمة ({self.entries.get('court').get()}).\nمكتب {self.settings.lawyer_name}."
        try:
            webbrowser.open(f"https://wa.me/{digits}?text={urllib.parse.quote(msg)}")
            messagebox.showinfo("نجاح", "تم الفتح في واتساب.")
        except Exception as e: messagebox.showerror("خطأ", str(e))

    def _add_to_google_calendar(self):
        target_date_str = self._get_date_value(self.entries['first_session'])
        reason = "أول جلسة"

        if self.delays_widgets:
            for date_entry, reason_entry, frame in reversed(self.delays_widgets):
                if frame.winfo_exists():
                    delay_date = self._get_date_value(date_entry)
                    if delay_date: 
                        target_date_str = delay_date
                        delay_reason = reason_entry.get().strip()
                        reason = f"تأجيل: {delay_reason}" if delay_reason else "تأجيل"
                        break

        parsed = CaseFileHandler._safe_parse_date(target_date_str) if target_date_str else None
        if not parsed: 
            return messagebox.showwarning("تنبيه", "لا يوجد تاريخ صالح لإضافته (أول جلسة أو تأجيل).")

        case_num = self.entries.get('case_number').get()
        court_name = self.entries.get('court').get()
        subject = self.entries.get('subject').get()
        
        title = f"جلسة قضية {case_num} - {court_name}"
        details = f"الموضوع: {subject}\nالسبب: {reason}"

        try:
            webbrowser.open(f"https://calendar.google.com/calendar/render?action=TEMPLATE&text={urllib.parse.quote(title)}&dates={parsed.strftime('%Y%m%d')}/{parsed.strftime('%Y%m%d')}&details={urllib.parse.quote(details)}")
            messagebox.showinfo("نجاح", "تم فتح تقويم جوجل لإضافة الجلسة.")
        except Exception as e: 
            messagebox.showerror("خطأ", str(e))

    def _add_attachment(self):
        if not self.current_file: return messagebox.showwarning("تنبيه", "افتح ملفاً.")
        files = filedialog.askopenfilenames(filetypes=[("الكل", "*.*"), ("مستندات", "*.pdf;*.doc;*.docx")])
        if not files: return
        try:
            for src in files:
                dst = os.path.join(os.path.dirname(self.current_file), os.path.basename(src))
                if os.path.abspath(src) != os.path.abspath(dst): shutil.copy2(src, dst)
            messagebox.showinfo("نجاح", "تم الإرفاق بنجاح.")
        except Exception as e: messagebox.showerror("خطأ", str(e))

    def _export_html_report(self):
        case = self._ui_to_case_data()
        try:
            safe_num = case.case_number.replace("/", "-").replace("\\", "-") if case.case_number else "unknown"
            report_path = os.path.join(LOG_DIR, f"Case_Report_{safe_num}.html")
            with open(report_path, "w", encoding="utf-8") as f: f.write(HTMLReportBuilder.build(case, self.settings))
            webbrowser.open(f"file://{report_path}")
            messagebox.showinfo("نجاح", "تم تصدير تقرير HTML بنجاح.")
        except Exception as e: messagebox.showerror("خطأ", str(e))

    def _export_pdf_report(self):
        if not PDFReportBuilder.is_available(): return messagebox.showwarning("تنبيه", "المكتبات مفقودة.")
        try: 
            path = PDFReportBuilder.build(self._ui_to_case_data(), self.settings)
            messagebox.showinfo("نجاح", f"تم التصدير بنجاح:\n{path}")
        except Exception as e: messagebox.showerror("خطأ", str(e))

    def _start_autosave(self):
        if self.settings.autosave_enabled:
            self._autosave_job = self.root.after(AppConstants.AUTOSAVE_INTERVAL_MS, self._autosave)

    def _autosave(self):
        if self._dirty and self.current_file:
            CaseFileHandler.save_case(self._ui_to_case_data(), os.path.dirname(self.current_file))
            self._dirty = False
        self._autosave_job = self.root.after(AppConstants.AUTOSAVE_INTERVAL_MS, self._autosave)

    def _export_all_cases_csv(self):
        if not self.settings.base_folder:
            messagebox.showwarning("تنبيه", "يرجى تحديد المجلد الرئيسي اولاً.")
            return
        fp = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("ملف CSV", "*.csv"), ("كل الملفات", "*.*")],
            title="حفظ ملف CSV",
            initialfile="قضايا_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".csv"
        )
        if not fp: return
        try:
            exported, errors = CSVExporter.export(self.settings.base_folder, fp)
            msg = f"تم تصدير {exported} قضية." + (f" (اخطاء: {errors})" if errors else "")
            messagebox.showinfo("تصدير CSV", msg)
            self.status_bar.set_success(f"تم التصدير: {fp}")
            PlatformHelper.open_folder_in_explorer(os.path.dirname(fp))
        except Exception as e:
            logger.error(f"خطأ في تصدير CSV: {e}")
            messagebox.showerror("خطأ", f"فشل التصدير:\n{e}")

    def _show_statistics(self):
        if not self.settings.base_folder:
            messagebox.showwarning("تنبيه", "يرجى تحديد المجلد الرئيسي اولاً.")
            return
        StatisticsWindow(self.root, self.settings.base_folder)

    def _on_close(self):
        if self._dirty:
            res = messagebox.askyesnocancel("تأكيد", "حفظ التعديلات؟")
            if res is None: return
            elif res and not (self._update_file() if self.current_file else self._create_file()): return
        if self._autosave_job: self.root.after_cancel(self._autosave_job)
        try: self.root.destroy()
        except tk.TclError: pass

def main():
    root = tk.Tk()
    app = CaseManagerApp(root)
    root.protocol("WM_DELETE_WINDOW", app._on_close)
    root.after(800, lambda: SessionAlertsManager.check_and_alert(app.settings.base_folder, root))
    root.mainloop()

if __name__ == "__main__":
    main()