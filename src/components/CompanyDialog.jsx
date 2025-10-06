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

  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    contactPhone: "",
    contactEmail: "",
    type: "private equity",
    trade: { hvac: false, plumbing: false, electrical: false },
    quote: null,
    logo: null,
    subscription: [],
    additionalServices: [],
    coach: "",
    salesman: "",
    successManager: "",
    kickoffDay: "",
    onsiteDay: "",
    revenue: "",
  })

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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleDrop = (e, field) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) setFormData({ ...formData, [field]: file })
  }

  const handleFileSelect = (e, field) => {
    const file = e.target.files[0]
    if (file) setFormData({ ...formData, [field]: file })
  }

  const handleTrade = (field) =>
    setFormData({
      ...formData,
      trade: { ...formData.trade, [field]: !formData.trade[field] },
    })

  const handleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const current = prev[field] || []
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isView) onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Edit toggle button */}
      {mode !== "add" && (
        <div className="flex justify-end">
          {isView && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setIsView(false)}
              title={t("editCompany")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Name */}
      <div className="grid gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isView}
        />
      </div>

      {/* Owner */}
      <div className="grid gap-2">
        <Label htmlFor="owner">{t("owner")}</Label>
        <Input
          id="owner"
          name="owner"
          value={formData.owner}
          onChange={handleChange}
          disabled={isView}
        />
      </div>

      {/* Primary Contact */}
      <div className="grid gap-2">
        <Label>{t("primaryContact")}</Label>
        <Input
          placeholder={t("phone")}
          name="contactPhone"
          value={formData.contactPhone}
          onChange={handleChange}
          disabled={isView}
        />
        <Input
          placeholder={t("email")}
          name="contactEmail"
          value={formData.contactEmail}
          onChange={handleChange}
          disabled={isView}
        />
      </div>

      {/* Type */}
      <div className="grid gap-2">
        <Label>{t("type")}</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(val) => setFormData({ ...formData, type: val })}
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
      </div>

      {/* Trade */}
      <div className="grid gap-2">
        <Label>{t("trade")}</Label>
        {["hvac", "plumbing", "electrical"].map((tKey) => (
          <div key={tKey} className="flex items-center space-x-2">
            <Checkbox
              checked={formData.trade?.[tKey] || false}
              onCheckedChange={() => handleTrade(tKey)}
              disabled={isView}
            />
            <Label className="capitalize">{t(tKey)}</Label>
          </div>
        ))}
      </div>

      {/* Quote PDF */}
      <div className="grid gap-2">
        <Label>{t("quotePdf")}</Label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "quote")}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition"
        >
          <Upload className="mx-auto mb-2 h-5 w-5 opacity-60" />
          <p className="text-sm text-muted-foreground">
            {formData.quote
              ? formData.quote.name
              : t("dragOrClickPdf")}
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
      </div>

      {/* Company Logo */}
      <div className="grid gap-2">
        <Label>{t("companyLogo")}</Label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "logo")}
          onClick={() => logoInputRef.current?.click()}
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition"
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
      </div>

      {/* Subscription */}
      <div className="grid gap-2">
        <Label>{t("subscription")}</Label>
        <Select
          onValueChange={(val) => handleMultiSelect("subscription", val)}
          disabled={isView}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("subscription")} />
          </SelectTrigger>
          <SelectContent>
            {["Leadership", "Service", "Sales", "Office Staff", "Install"].map(
              (option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {t("selected")}: {(formData.subscription || []).join(", ") || t("none")}
        </p>
      </div>

      {/* Additional Services */}
      <div className="grid gap-2">
        <Label>{t("additionalServices")}</Label>
        <Select
          onValueChange={(val) => handleMultiSelect("additionalServices", val)}
          disabled={isView}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("additionalServices")} />
          </SelectTrigger>
          <SelectContent>
            {["Onsite", "Career Mapping", "Onboarding Development"].map(
              (option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {t("selected")}: {(formData.additionalServices || []).join(", ") || t("none")}
        </p>
      </div>

      {/* Other fields */}
      {[
        ["coach", t("coachLabel")],
        ["salesman", t("salesman")],
        ["successManager", t("successManager")],
      ].map(([name, label]) => (
        <div key={name} className="grid gap-2">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            disabled={isView}
          />
        </div>
      ))}

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

      <div className="grid gap-2">
        <Label htmlFor="revenue">{t("revenue")}</Label>
        <Input
          id="revenue"
          type="number"
          name="revenue"
          value={formData.revenue}
          onChange={handleChange}
          disabled={isView}
        />
      </div>

      {!isView && (
        <Button type="submit" className="w-full">
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
