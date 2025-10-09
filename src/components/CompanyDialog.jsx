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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

// =========================================================
// CompanyForm
// =========================================================
export function CompanyForm({ mode = "add", data = null, onSubmit }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const logoInputRef = useRef(null)

  // Mock single-select options (replace with API later)
  const coachOptions = ["Danny Vega", "Alice Parker", "Tomás Aguilar"]
  const salesmanOptions = ["Sofia Ramirez", "Liam Cohen", "Alex Wang"]
  const successManagerOptions = ["Elena Cruz", "Miguel Torres", "Ryan Lee"]

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
    quote: null, // PDF
    logo: null,  // Image
  })

  const [errors, setErrors] = useState({})
  const [isView, setIsView] = useState(mode === "view")

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
      case "quote":
        if (value && value.type !== "application/pdf") return t("invalidPdf")
        break
      case "logo":
        if (value && !String(value.type || "").startsWith("image/"))
          return t("invalidImage")
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

  // Real-time validation
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
    setFormData((prev) => {
      const nextTrade = { ...prev.trade, [key]: !prev.trade[key] }
      return { ...prev, trade: nextTrade }
    })
  }

  // Multi-selects (subscription, additionalServices) using Select toggling
  const handleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const arr = prev[field] || []
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateAll()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    if (!isView) onSubmit(formData)
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Edit toggle in view mode */}
      {mode !== "add" && isView && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setIsView(false)}
            title={t("editCompany")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Name */}
      <div className="grid gap-2">
        <Label htmlFor="name">{t("name")} *</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={isView} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      {/* Owner */}
      <div className="grid gap-2">
        <Label htmlFor="owner">{t("owner")} *</Label>
        <Input id="owner" name="owner" value={formData.owner} onChange={handleChange} disabled={isView} />
        {errors.owner && <p className="text-red-500 text-sm">{errors.owner}</p>}
      </div>

      {/* Primary Contact */}
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

      {/* Type (radio) */}
      <div className="grid gap-2">
        <Label>{t("type")} *</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
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

      {/* Trade (multi checkbox) */}
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

      {/* Subscription (multi-select via toggle) */}
      <div className="grid gap-2">
        <Label>{t("subscription")}</Label>
        <Select onValueChange={(val) => handleMultiSelect("subscription", val)} disabled={isView}>
          <SelectTrigger>
            <SelectValue placeholder={t("subscription")} />
          </SelectTrigger>
          <SelectContent>
            {["Leadership", "Service", "Sales", "Office Staff", "Install"].map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {t("selected")}: {(formData.subscription || []).join(", ") || t("none")}
        </p>
      </div>

      {/* Additional Services (multi-select via toggle) */}
      <div className="grid gap-2">
        <Label>{t("additionalServices")}</Label>
        <Select onValueChange={(val) => handleMultiSelect("additionalServices", val)} disabled={isView}>
          <SelectTrigger>
            <SelectValue placeholder={t("additionalServices")} />
          </SelectTrigger>
          <SelectContent>
            {["Onsite", "Career Mapping", "Onboarding Development"].map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {t("selected")}: {(formData.additionalServices || []).join(", ") || t("none")}
        </p>
      </div>

      {/* Coach / Salesman / Success Manager (single-selects) */}
      {[
        ["coach", t("coachLabel"), coachOptions],
        ["salesman", t("salesman"), salesmanOptions],
        ["successManager", t("successManager"), successManagerOptions],
      ].map(([name, label, options]) => (
        <div key={name} className="grid gap-2">
          <Label htmlFor={name}>{label} *</Label>
          <Select
            value={formData[name]}
            onValueChange={(val) => setFormData((prev) => ({ ...prev, [name]: val }))}
            disabled={isView}
          >
            <SelectTrigger>
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
        </div>
      ))}

      {/* Training Kickoff & Onsite Day (dates) */}
      <div className="grid gap-2">
        <Label htmlFor="kickoffDay">{t("trainingKickoffDay")}</Label>
        <Input
          id="kickoffDay"
          type="date"
          name="kickoffDay"
          value={formData.kickoffDay}
          onChange={handleChange}
          disabled={isView}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="onsiteDay">{t("onsiteDay")}</Label>
        <Input
          id="onsiteDay"
          type="date"
          name="onsiteDay"
          value={formData.onsiteDay}
          onChange={handleChange}
          disabled={isView}
        />
      </div>

      {/* Revenue */}
      <div className="grid gap-2">
        <Label htmlFor="revenue">{t("revenue")} *</Label>
        <Input
          id="revenue"
          type="number"
          name="revenue"
          value={formData.revenue}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.revenue && <p className="text-red-500 text-sm">{errors.revenue}</p>}
      </div>

      {/* PDF drag & drop */}
      <div className="grid gap-2">
        <Label>{t("quotePdf")}</Label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "quote")}
          onClick={() => !isView && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition ${
            isView ? "opacity-60 cursor-not-allowed" : ""
          }`}
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
            disabled={isView}
          />
        </div>
        {errors.quote && <p className="text-red-500 text-sm">{errors.quote}</p>}
      </div>

      {/* Image drag & drop */}
      <div className="grid gap-2">
        <Label>{t("companyLogo")}</Label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "logo")}
          onClick={() => !isView && logoInputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition ${
            isView ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          <Upload className="mx-auto mb-2 h-5 w-5 opacity-60" />
          {formData.logo ? (
            <div className="flex flex-col items-center">
              <img
                src={URL.createObjectURL(formData.logo)}
                alt="Logo preview"
                className="h-16 object-contain mb-2"
              />
              <p className="text-sm text-muted-foreground">{formData.logo.name}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("dragOrClickImage")}
            </p>
          )}
          <input
            type="file"
            accept="image/*"
            ref={logoInputRef}
            onChange={(e) => handleFileSelect(e, "logo")}
            className="hidden"
            disabled={isView}
          />
        </div>
        {errors.logo && <p className="text-red-500 text-sm">{errors.logo}</p>}
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
