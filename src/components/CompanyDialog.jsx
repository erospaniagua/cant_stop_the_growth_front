import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

// =========================================================
// CompanyForm
// =========================================================
export function CompanyForm({ mode = "add", data = null, onSubmit }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const logoInputRef = useRef(null)

  // Mock dropdown options (single select fields)
  const coachOptions = ["Danny Vega", "Alice Parker", "Tomás Aguilar"]
  const salesmanOptions = ["Sofia Ramirez", "Liam Cohen", "Alex Wang"]
  const successManagerOptions = ["Elena Cruz", "Miguel Torres", "Ryan Lee"]
  const subscriptionOptions = ["Leadership", "Service", "Sales", "Office Staff", "Install"]
  const serviceOptions = ["Onsite", "Career Mapping", "Onboarding Development"]

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
  })

  const [errors, setErrors] = useState({})
  const [isView, setIsView] = useState(mode === "view")
  const [currentMode, setCurrentMode] = useState(mode)

  

  useEffect(() => {
    if (data) {
      setFormData((prev) => ({
        ...prev,
        ...data,
        subscription: data.subscription || [],
        additionalServices: data.additionalServices || [],
        trade: data.trade || { hvac: false, plumbing: false, electrical: false },
      }))
    }
  }, [data])

  // -------------------------------------------------------
  // Validation
  // -------------------------------------------------------
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim()) return t("requiredName")
        break
      case "owner":
        if (!value.trim()) return t("requiredOwner")
        break
      case "contactEmail":
        if (!value.trim()) return t("requiredEmail")
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return t("invalidEmail")
        break
      case "contactPhone":
        if (!value.trim()) return t("requiredPhone")
        if (!/^[0-9]{7,15}$/.test(value)) return t("invalidPhone")
        break
      case "type":
        if (!value) return t("requiredType")
        break
      case "trade":
        if (!Object.values(value).some(Boolean)) return t("requiredTrade")
        break
      case "coach":
        if (!value) return t("requiredCoach")
        break
      case "salesman":
        if (!value) return t("requiredSalesman")
        break
      case "successManager":
        if (!value) return t("requiredSuccessManager")
        break
      case "revenue":
        if (!value) return t("requiredRevenue")
        if (Number(value) <= 0) return t("invalidRevenue")
        break
      default:
        return ""
    }
    return ""
  }

  const validateAll = () => {
    const newErrors = {}
    Object.entries(formData).forEach(([key, val]) => {
      const err = validateField(key, val)
      if (err) newErrors[key] = err
    })
    return newErrors
  }

  useEffect(() => {
    setErrors(validateAll())
  }, [formData])

  // -------------------------------------------------------
  // Handlers
  // -------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDrop = (e, field) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const handleFileSelect = (e, field) => {
    const file = e.target.files?.[0]
    if (file) setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const handleTrade = (key) => {
    setFormData((prev) => ({
      ...prev,
      trade: { ...prev.trade, [key]: !prev.trade[key] },
    }))
  }

  const toggleArrayValue = (field, value) => {
    setFormData((prev) => {
      const arr = prev[field] || []
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      }
    })
  }

  const handleSubmit = async (e) => {
  e.preventDefault();

  const newErrors = validateAll();
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // Build form data
  const formDataToSend = new FormData();
  Object.entries(formData).forEach(([key, value]) => {
    if (["trade", "subscription", "additionalServices"].includes(key)) {
      formDataToSend.append(key, JSON.stringify(value));
    } else if (key !== "quote" && key !== "logo") {
      formDataToSend.append(key, value ?? "");
    }
  });

  if (formData.quote) formDataToSend.append("quote", formData.quote);
  if (formData.logo) formDataToSend.append("companyLogo", formData.logo);

  // ✅ Use PUT when editing
  const companyId = data?._id || formData?._id;
const isEdit = currentMode === "edit" && companyId;

const url = isEdit
  ? `http://localhost:5000/api/companies/${companyId}`
  : "http://localhost:5000/api/companies";

const method = isEdit ? "PUT" : "POST";

console.log("Submitting in mode:", currentMode, "→", method, url);

  try {
    const response = await fetch(url, {
      method,
      body: formDataToSend,
    });

    if (!response.ok) {
      const err = await response.json();
      alert("❌ " + err.message);
      return;
    }

    const result = await response.json();
    alert(
      mode === "edit"
        ? "✅ " + t("companyUpdatedSuccess")
        : "✅ " + t("companyAddedSuccess")
    );

    // Reset form (optional for edit)
    if (mode === "add") {
      setFormData({
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
    }

    onSubmit?.(result); // let parent refresh the table
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("❌ Network error");
  }
};


  // -------------------------------------------------------
  // File preview helpers
  // -------------------------------------------------------
  const getFileUrl = (file) => {
    if (!file) return ""
    if (file instanceof File) return URL.createObjectURL(file)
    if (file.startsWith("http")) return file
    return `http://localhost:5000/${file}`
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode !== "add" && isView && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => {setIsView(false)
                            setCurrentMode("edit")}}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid gap-2">
        <Label>{t("name")} *</Label>
        <Input name="name" value={formData.name} onChange={handleChange} disabled={isView} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div className="grid gap-2">
        <Label>{t("owner")} *</Label>
        <Input name="owner" value={formData.owner} onChange={handleChange} disabled={isView} />
        {errors.owner && <p className="text-red-500 text-sm">{errors.owner}</p>}
      </div>

      <div className="grid gap-2">
        <Label>{t("primaryContact")} *</Label>
        <Input
          placeholder={t("phone")}
          name="contactPhone"
          value={formData.contactPhone}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone}</p>}
        <Input
          placeholder={t("email")}
          name="contactEmail"
          value={formData.contactEmail}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail}</p>}
      </div>

      {/* Type */}
      <div className="grid gap-2">
        <Label>{t("type")} *</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(val) => setFormData((p) => ({ ...p, type: val }))}
          disabled={isView}
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
        {["hvac", "plumbing", "electrical"].map((k) => (
          <div key={k} className="flex items-center space-x-2">
            <Checkbox
              checked={!!formData.trade[k]}
              onCheckedChange={() => handleTrade(k)}
              disabled={isView}
            />
            <Label className="capitalize">{t(k)}</Label>
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

      {/* Additional Services */}
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

      {/* Select fields */}
      {[
        ["coach", t("coachLabel"), coachOptions],
        ["salesman", t("salesman"), salesmanOptions],
        ["successManager", t("successManager"), successManagerOptions],
      ].map(([name, label, opts]) => (
        <div key={name} className="grid gap-2">
          <Label>{label} *</Label>
          <select
            name={name}
            className="border rounded-md p-2"
            value={formData[name]}
            onChange={handleChange}
            disabled={isView}
          >
            <option value="">{t("selectOption")}</option>
            {opts.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
        </div>
      ))}

      {/* Dates + Revenue */}
      <div className="grid gap-2">
        <Label>{t("trainingKickoffDay")}</Label>
        <Input type="date" name="kickoffDay" value={formData.kickoffDay} onChange={handleChange} disabled={isView} />
      </div>
      <div className="grid gap-2">
        <Label>{t("onsiteDay")}</Label>
        <Input type="date" name="onsiteDay" value={formData.onsiteDay} onChange={handleChange} disabled={isView} />
      </div>
      <div className="grid gap-2">
        <Label>{t("revenue")} *</Label>
        <Input type="number" name="revenue" value={formData.revenue} onChange={handleChange} disabled={isView} />
        {errors.revenue && <p className="text-red-500 text-sm">{errors.revenue}</p>}
      </div>

      {/* Quote PDF */}
      <div className="grid gap-2">
        <Label>{t("quotePdf")}</Label>
        {isView && formData.quote && (
          <a
            href={getFileUrl(formData.quote)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            📄 {t("viewQuotePdf")}
          </a>
        )}
        {!isView && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "quote")}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition"
          >
            <Upload className="mx-auto mb-2 h-5 w-5 opacity-60" />
            <p className="text-sm text-muted-foreground">
              {formData.quote ? formData.quote.name : t("dragOrClickPdf")}
            </p>
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e, "quote")}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Logo */}
      <div className="grid gap-2">
        <Label>{t("companyLogo")}</Label>
        {isView && formData.logo && (
          <a href={getFileUrl(formData.logo)} target="_blank" rel="noopener noreferrer">
            <img
              src={getFileUrl(formData.logo)}
              alt="Company logo"
              className="h-16 object-contain mb-2 border rounded-md"
            />
          </a>
        )}
        {!isView && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "logo")}
            onClick={() => logoInputRef.current?.click()}
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition"
          >
            <Upload className="mx-auto mb-2 h-5 w-5 opacity-60" />
            <p className="text-sm text-muted-foreground">
              {formData.logo ? formData.logo.name : t("dragOrClickImage")}
            </p>
            <input
              type="file"
              accept="image/*"
              ref={logoInputRef}
              onChange={(e) => handleFileSelect(e, "logo")}
              className="hidden"
            />
          </div>
        )}
      </div>

      {!isView && (
        <Button type="submit" className="w-full" disabled={Object.keys(errors).length > 0}>
          {mode === "add" ? t("addCompany") : t("saveChanges")}
        </Button>
      )}
    </form>
  )
}

// =========================================================
// CompanyDialog
// =========================================================
export function CompanyDialog({ open, onClose, mode, company, onSubmit }) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? t("addNewCompany")
              : mode === "view"
              ? `${t("viewCompany")}${company?.name ? ` – ${company.name}` : ""}`
              : `${t("editCompany")}${company?.name ? ` – ${company.name}` : ""}`}
          </DialogTitle>
        </DialogHeader>
        <CompanyForm mode={mode} data={company} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
}
