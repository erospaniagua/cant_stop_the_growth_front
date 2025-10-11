import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Plus, Eye, RefreshCw ,Archive} from "lucide-react"
import { cn } from "@/lib/utils"
import { CompanyDialog } from "@/components/CompanyDialog"
import { useTranslation } from "react-i18next"

export default function Companies() {
  const { t } = useTranslation()
  const [companies, setCompanies] = useState([])
  const [expandedRow, setExpandedRow] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialog, setDialog] = useState({ open: false, mode: "add", company: null })
  const [showArchived, setShowArchived] = useState(false)

  

  // ============================================
  // Fetch companies from backend
  // ============================================
  const fetchCompanies = async (archived = false) => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/api/companies?archived=${archived}`)
      if (!res.ok) throw new Error("Failed to fetch companies")
      const data = await res.json()
      setCompanies(data)
    } catch (err) {
      setError("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchCompanies(showArchived)
  }, [showArchived])

  // ============================================
  // Handlers
  // ============================================
  const toggleExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCompanies()
    setRefreshing(false)
  }

  const handleArchive = async (id, archived) => {
  if (!window.confirm(`Are you sure you want to ${archived ? "archive" : "unarchive"} this company?`)) return

  try {
    const res = await fetch(`http://localhost:5000/api/companies/${id}/archive`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    })

    if (!res.ok) throw new Error("Failed to update archive status")

    await fetchCompanies() // refresh list
  } catch (error) {
    console.error(error)
    alert("❌ Failed to update archive status")
  }
}

  const handleAdd = () => {
    setDialog({ open: true, mode: "add", company: null })
  }

  const handleView = (company) => {
    setDialog({ open: true, mode: "view", company })
  }

  const handleSubmit = async () => {
    // after adding/editing, refresh the list
    await fetchCompanies()
    setDialog({ ...dialog, open: false })
  }

  // ============================================
  // UI
  // ============================================
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">{t("loading")}...</p>
      </div>
    )

  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchCompanies}>{t("retry")}</Button>
      </div>
    )

  return (
    <div className="space-y-6 relative">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("companiesTitle")}</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            title={t("refresh")}
          >
            <RefreshCw
              className={cn(
                "h-5 w-5 transition-transform",
                refreshing && "animate-spin"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAdd}
            title={t("addCompany")}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
        <div className="flex gap-4 border-b mb-4">
      <button
        className={`pb-2 ${
          !showArchived ? "border-b-2 border-primary font-semibold" : ""
        }`}
        onClick={() => setShowArchived(false)}
      >
        Active
      </button>
      <button
        className={`pb-2 ${
          showArchived ? "border-b-2 border-primary font-semibold" : ""
        }`}
        onClick={() => setShowArchived(true)}
      >
        Archived
      </button>
    </div>
      {/* Companies Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("owner")}</TableHead>
            <TableHead>{t("contactEmail")}</TableHead>
            <TableHead>{t("revenue")}</TableHead>
            <TableHead>{t("trade")}</TableHead>
            <TableHead>{t("coach")}</TableHead>
            <TableHead>{t("salesman")}</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {companies.map((company) => (
            <React.Fragment key={company._id}>
              <TableRow>
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.owner}</TableCell>
                <TableCell>{company.contactEmail}</TableCell>
                <TableCell>
                  ${Number(company.revenue).toLocaleString()}
                </TableCell>
                <TableCell>
                  {Object.entries(company.trade || {})
                    .filter(([_, val]) => val)
                    .map(([key]) => key.toUpperCase())
                    .join(", ") || "—"}
                </TableCell>
                <TableCell>{company.coach}</TableCell>
                <TableCell>{company.salesman}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleArchive(company._id, !company.archived)}
                    title={company.archived ? "Unarchive" : "Archive"}
                    >
                   <Archive className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleView(company)}
                    title={t("viewCompany")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpand(company._id)}
                    title={t("expand")}
                  >
                    {expandedRow === company._id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>

              {/* Expanded quick actions */}
              {expandedRow === company._id && (
                <>
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={8}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t("employees")}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="w-32">
                            {t("addEmployee")}
                          </Button>
                          <Button size="sm" variant="outline" className="w-32">
                            {t("assignClass")}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={8}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t("reports")}</span>
                        <Button size="sm" variant="outline" className="w-32">
                          {t("reports")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      {/* Dialog */}
      <CompanyDialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        mode={dialog.mode}
        company={dialog.company}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
