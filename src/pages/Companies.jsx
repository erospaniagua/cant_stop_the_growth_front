import React, { useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CompanyDialog } from "@/components/CompanyDialog"
import { useTranslation } from "react-i18next"

export default function Companies() {
  const { t } = useTranslation()
  const [expandedRow, setExpandedRow] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [dialog, setDialog] = useState({ open: false, mode: "add", company: null })

  // Demo data
  const [companies, setCompanies] = useState([
    {
      id: 1,
      name: "Eros Inc.",
      manager: "Eros",
      teamSize: 200,
      revenue: 1000000,
      trade: "Trade",
      coach: "Danny",
      status: "Active",
    },
    {
      id: 2,
      name: "Juan Corp.",
      manager: "Carlos",
      teamSize: 100,
      revenue: 200000,
      trade: "HVAC",
      coach: "Maria",
      status: "Inactive",
    },
  ])

  const toggleExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      console.log("Refreshed data!") // simulate API call
    }, 800)
  }

  const handleAdd = () => {
    setDialog({ open: true, mode: "add", company: null })
  }

  const handleView = (company) => {
    setDialog({ open: true, mode: "view", company })
  }

  const handleSubmit = (newData) => {
    if (dialog.mode === "add") {
      setCompanies([...companies, { id: Date.now(), ...newData }])
    } else if (dialog.mode === "edit") {
      setCompanies(
        companies.map((c) =>
          c.id === dialog.company.id ? { ...c, ...newData } : c
        )
      )
    }
    setDialog({ ...dialog, open: false })
  }

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

      {/* Companies Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("manager")}</TableHead>
            <TableHead>{t("teamSize")}</TableHead>
            <TableHead>{t("revenue")}</TableHead>
            <TableHead>{t("trade")}</TableHead>
            <TableHead>{t("coach")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {companies.map((company) => (
            <React.Fragment key={company.id}>
              <TableRow>
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.manager}</TableCell>
                <TableCell>{company.teamSize}</TableCell>
                <TableCell>${company.revenue.toLocaleString()}</TableCell>
                <TableCell>{company.trade}</TableCell>
                <TableCell>{company.coach}</TableCell>
                <TableCell>{company.status}</TableCell>
                <TableCell className="flex gap-2">
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
                    onClick={() => toggleExpand(company.id)}
                    title={t("expand")}
                  >
                    {expandedRow === company.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>

              {/* Expanded quick actions */}
              {expandedRow === company.id && (
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
                        <span className="font-medium">{t("managers")}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="w-32">
                            {t("addManager")}
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
                        <span className="font-medium">{t("coach")}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="w-32">
                            {t("addCoach")}
                          </Button>
                          <Button size="sm" variant="outline" className="w-32">
                            {t("assignCoach")}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={8}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t("access")}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="w-32">
                            {t("addAccess")}
                          </Button>
                          <Button size="sm" variant="outline" className="w-32">
                            {t("assignAccess")}
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
