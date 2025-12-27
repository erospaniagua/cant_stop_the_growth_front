import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUser } from "@/context/UserContext";
import { apiClient } from "@/api/client";

//const API_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = import.meta.env.VITE_API_BASE_URL
/* =========================================================
   CompanyForm
========================================================= */
export function CompanyForm({ mode = "add", data = null, onSubmit }) {
  const { t } = useTranslation();
  const { token } = useUser();

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const normalizeDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toISOString().split("T")[0];
  };

  /* ===== Dynamic CRM staff lists ===== */
  const [coachOptions, setCoachOptions] = useState([]);
  const [salesmanOptions, setSalesmanOptions] = useState([]);
  const [successManagerOptions, setSuccessManagerOptions] = useState([]);

  const loadUserOptions = async () => {
    try {
      const [coach, sales, success] = await Promise.all([
        apiClient.get("/api/users/by-subrole/coach"),
        apiClient.get("/api/users/by-subrole/salesman"),
        apiClient.get("/api/users/by-subrole/successManager"),
      ]);

      setCoachOptions(coach);
      setSalesmanOptions(sales);
      setSuccessManagerOptions(success);
    } catch (err) {
      console.error("Error loading subrole users:", err);
    }
  };

  useEffect(() => {
    loadUserOptions();
  }, []);

  const subscriptionOptions = [
    "Leadership",
    "Service",
    "Sales",
    "Office Staff",
    "Install",
  ];
  const serviceOptions = [
    "Onsite",
    "Career Mapping",
    "Onboarding Development",
  ];

  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    contactPhone: "",
    contactEmail: "",
    type: "",
    trade: { hvac: false, plumbing: false, electrical: false },
    subscription: [],
    additionalServices: [],
    coach: "",
    salesman: "",
    successManager: "",
    kickoffDay: "",
    onsiteDay: "",
    revenue: "",
    quote: null,
    logo: null,
  });

  const [errors, setErrors] = useState({});
  const [isView, setIsView] = useState(mode === "view");
  const [currentMode, setCurrentMode] = useState(mode);

  /* =========================================================
     Load data when editing
  ========================================================== */
  useEffect(() => {
    if (data) {
      setFormData((prev) => ({
        ...prev,
        ...data,
        subscription: data.subscription || [],
        additionalServices: data.additionalServices || [],
        trade: data.trade || { hvac: false, plumbing: false, electrical: false },
        kickoffDay: normalizeDate(data.kickoffDay),
        onsiteDay: normalizeDate(data.onsiteDay),
      }));
    }
  }, [data]);

  /* =========================================================
     Validation
  ========================================================== */
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim()) return t("requiredName");
        break;
      case "owner":
        if (!value.trim()) return t("requiredOwner");
        break;
      case "contactEmail":
        if (!value.trim()) return t("requiredEmail");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
          return t("invalidEmail");
        break;
      case "contactPhone":
        if (!value.trim()) return t("requiredPhone");
        if (!/^[0-9]{7,15}$/.test(value)) return t("invalidPhone");
        break;
      case "type":
        if (!value) return t("requiredType");
        break;
      case "trade":
        if (!Object.values(value).some(Boolean)) return t("requiredTrade");
        break;
        case "coach":
        case "salesman":
        case "successManager":
  return "";

      case "revenue":
        if (!value) return t("requiredRevenue");
        if (Number(value) <= 0) return t("invalidRevenue");
        break;
      default:
        return "";
    }
    return "";
  };

  const validateAll = () => {
    const errs = {};
    Object.entries(formData).forEach(([k, v]) => {
      const e = validateField(k, v);
      if (e) errs[k] = e;
    });
    return errs;
  };

  useEffect(() => {
    setErrors(validateAll());
  }, [formData]);

  /* =========================================================
     Handlers
  ========================================================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileSelect = (e, field) => {
    const file = e.target.files?.[0];
    if (file) setFormData((p) => ({ ...p, [field]: file }));
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setFormData((p) => ({ ...p, [field]: file }));
  };

  const handleTrade = (key) => {
    setFormData((p) => ({
      ...p,
      trade: { ...p.trade, [key]: !p.trade[key] },
    }));
  };

  const toggleArrayValue = (field, value) =>
    setFormData((p) => ({
      ...p,
      [field]: p[field].includes(value)
        ? p[field].filter((x) => x !== value)
        : [...p[field], value],
    }));

  /* =========================================================
     Submit
  ========================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateAll();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (["trade", "subscription", "additionalServices"].includes(key)) {
        fd.append(key, JSON.stringify(value));
      } else if (key !== "quote" && key !== "logo") {
        fd.append(key, value ?? "");
      }
    });

    if (formData.quote) fd.append("quote", formData.quote);
    if (formData.logo) fd.append("companyLogo", formData.logo);

    const companyId = data?._id;
    const isEdit = currentMode === "edit" && companyId;

    const url = isEdit
      ? `${API_URL}/api/companies/${companyId}`
      : `${API_URL}/api/companies`;

    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        alert("❌ " + err.message);
        return;
      }

      const result = await res.json();
      alert(isEdit ? "Company updated" : "Company added");
      onSubmit?.(result);

    } catch (err) {
      console.error(err);
      alert("❌ Network error");
    }
  };

  const getFileUrl = (file) => {
    if (!file) return "";
    if (file instanceof File) return URL.createObjectURL(file);
    if (file.startsWith("http")) return file;
    return `${API_URL}/${file}`;
  };

  /* =========================================================
     UI
  ========================================================== */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode !== "add" && isView && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsView(false);
              setCurrentMode("edit");
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Name */}
      <div className="grid gap-2">
        <Label>{t("name")} *</Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      {/* Owner */}
      <div className="grid gap-2">
        <Label>{t("owner")} *</Label>
        <Input
          name="owner"
          value={formData.owner}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.owner && <p className="text-red-500 text-sm">{errors.owner}</p>}
      </div>

      {/* Contact */}
      <div className="grid gap-2">
        <Label>{t("primaryContact")} *</Label>

        <Input
          name="contactPhone"
          value={formData.contactPhone}
          placeholder={t("phone")}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.contactPhone && (
          <p className="text-red-500 text-sm">{errors.contactPhone}</p>
        )}

        <Input
          name="contactEmail"
          value={formData.contactEmail}
          placeholder={t("email")}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.contactEmail && (
          <p className="text-red-500 text-sm">{errors.contactEmail}</p>
        )}
      </div>

      {/* Type */}
      <div className="grid gap-2">
        <Label>{t("type")} *</Label>
        <RadioGroup
          value={formData.type}
          disabled={isView}
          onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private equity" id="equity" />
            <Label htmlFor="equity">{t("privateEquity")}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private owner" id="ownerType" />
            <Label htmlFor="ownerType">{t("privateOwner")}</Label>
          </div>
        </RadioGroup>
        {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
      </div>

      {/* Trade */}
      <div className="grid gap-2">
        <Label>{t("trade")} *</Label>
        {["hvac", "plumbing", "electrical"].map((key) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              checked={!!formData.trade[key]}
              onCheckedChange={() => handleTrade(key)}
              disabled={isView}
            />
            <Label className="capitalize">{t(key)}</Label>
          </div>
        ))}
        {errors.trade && <p className="text-red-500 text-sm">{errors.trade}</p>}
      </div>

      {/* Subscription */}
      <div className="grid gap-2">
        <Label>{t("subscription")}</Label>
        {subscriptionOptions.map((opt) => (
          <div key={opt} className="flex items-center space-x-2">
            <Checkbox
              checked={formData.subscription.includes(opt)}
              onCheckedChange={() => toggleArrayValue("subscription", opt)}
              disabled={isView}
            />
            <Label>{opt}</Label>
          </div>
        ))}
      </div>

      {/* Services */}
      <div className="grid gap-2">
        <Label>{t("additionalServices")}</Label>
        {serviceOptions.map((opt) => (
          <div key={opt} className="flex items-center space-x-2">
            <Checkbox
              checked={formData.additionalServices.includes(opt)}
              onCheckedChange={() => toggleArrayValue("additionalServices", opt)}
              disabled={isView}
            />
            <Label>{opt}</Label>
          </div>
        ))}
      </div>

      {/* Dynamic staff selectors */}
      {[
        ["coach", t("coachLabel"), coachOptions],
        ["salesman", t("salesman"), salesmanOptions],
        ["successManager", t("successManager"), successManagerOptions],
      ].map(([name, label, opts]) => (
        <div key={name} className="grid gap-2">
          <Label>{label} </Label>

          <select
            name={name}
            className="border rounded-md p-2"
            value={formData[name]}
            onChange={handleChange}
            disabled={isView}
          >
            <option value="">{t("selectOption")}</option>

            {opts.map((o) => (
              <option key={o._id} value={o.name}>
                {o.name}
              </option>
            ))}
          </select>

          {errors[name] && (
            <p className="text-red-500 text-sm">{errors[name]}</p>
          )}
        </div>
      ))}

      {/* Kickoff Day */}
      <div className="grid gap-2">
        <Label>{t("trainingKickoffDay")}</Label>
        <Input
          type="date"
          name="kickoffDay"
          value={formData.kickoffDay}
          disabled={isView}
          onChange={handleChange}
        />
      </div>

      {/* Onsite Day */}
      <div className="grid gap-2">
        <Label>{t("onsiteDay")}</Label>
        <Input
          type="date"
          name="onsiteDay"
          value={formData.onsiteDay}
          disabled={isView}
          onChange={handleChange}
        />
      </div>

      {/* Revenue */}
      <div className="grid gap-2">
        <Label>{t("revenue")} *</Label>
        <Input
          type="number"
          name="revenue"
          value={formData.revenue}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.revenue && (
          <p className="text-red-500 text-sm">{errors.revenue}</p>
        )}
      </div>

      {/* Quote Upload */}
      <div className="grid gap-2">
        <Label>{t("quotePdf")}</Label>

        {isView && formData.quote && (
          <a
            href={getFileUrl(formData.quote)}
            target="_blank"
            className="text-blue-600 underline text-sm"
          >
            📄 {t("viewQuotePdf")}
          </a>
        )}

        {!isView && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "quote")}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer"
          >
            <Upload className="mx-auto mb-2 h-5 w-5 opacity-60" />
            <p className="text-sm text-muted-foreground">
              {formData.quote ? formData.quote.name : t("dragOrClickPdf")}
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "quote")}
            />
          </div>
        )}
      </div>

      {/* Logo Upload */}
      <div className="grid gap-2">
        <Label>{t("companyLogo")}</Label>

        {isView && formData.logo && (
          <a href={getFileUrl(formData.logo)} target="_blank">
            <img
              src={getFileUrl(formData.logo)}
              className="h-16 object-contain border rounded-md"
            />
          </a>
        )}

        {!isView && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "logo")}
            onClick={() => logoInputRef.current?.click()}
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer"
          >
            <Upload className="mx-auto mb-2 h-5 w-5 opacity-60" />
            <p className="text-sm text-muted-foreground">
              {formData.logo ? formData.logo.name : t("dragOrClickImage")}
            </p>

            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "logo")}
            />
          </div>
        )}
      </div>

      {!isView && (
        <Button
          type="submit"
          className="w-full"
          disabled={Object.keys(errors).length > 0}
        >
          {mode === "add" ? t("addCompany") : t("saveChanges")}
        </Button>
      )}
    </form>
  );
}

/* =========================================================
   CompanyDialog
========================================================= */
export function CompanyDialog({ open, onClose, mode, company, onSubmit }) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? t("addNewCompany")
              : mode === "view"
              ? `${t("viewCompany")} – ${company?.name || ""}`
              : `${t("editCompany")} – ${company?.name || ""}`}
          </DialogTitle>
        </DialogHeader>

        <CompanyForm
          mode={mode}
          data={company}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
