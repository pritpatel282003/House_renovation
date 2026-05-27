'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, ArrowRight, IndianRupee, Ruler } from 'lucide-react'
import { runEstimate, updateRates } from '@/lib/api'
import type { CostBreakdown as CostBreakdownType } from '@/lib/types'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function CostBreakdown() {
  const {
    projectId,
    costData,
    setCostData,
    isLoading,
    setLoading,
    nextStep,
  } = useProjectStore()

  const [editingCell, setEditingCell] = useState<{
    index: number
    field: 'material_rate' | 'labor_rate'
  } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editingWastage, setEditingWastage] = useState(false)
  const [wastageValue, setWastageValue] = useState('')
  const [showCalibration, setShowCalibration] = useState(false)
  const [refFeet, setRefFeet] = useState('')

  useEffect(() => {
    if (!costData) handleEstimate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEstimate = async (pixelsPerFoot?: number) => {
    if (!projectId) return
    setLoading(true)
    try {
      const costResult = await runEstimate(projectId, {
        ...(pixelsPerFoot != null && { pixels_per_foot: pixelsPerFoot }),
      })
      setCostData(costResult)
    } catch (err) {
      console.error('Estimation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCalibrate = () => {
    const feet = parseFloat(refFeet)
    if (isNaN(feet) || feet <= 0) return
    const pixelsPerFoot = feet > 0 ? feet : undefined
    setShowCalibration(false)
    handleEstimate(pixelsPerFoot)
  }

  const handleWastageEdit = async (value: string) => {
    if (!projectId) return
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return

    setEditingWastage(false)
    setLoading(true)

    try {
      const costResult = await runEstimate(projectId, { wastage_percent: numValue })
      setCostData(costResult)
    } catch (err) {
      console.error('Wastage update failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRateEdit = async (
    index: number,
    field: 'material_rate' | 'labor_rate',
    value: string
  ) => {
    if (!costData || !projectId) return
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) return

    setEditingCell(null)
    setLoading(true)

    try {
      const lineItem = costData.line_items[index]
      const overrides: Record<string, { material_rate?: number; labor_rate?: number }> = {}

      overrides[lineItem.region] = {
        [field]: numValue,
      }

      const costResult = await updateRates(projectId, overrides)
      setCostData(costResult)
    } catch (err) {
      console.error('Rate update failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading && !costData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C4622D]" />
        <p className="text-[#1C2B3A]/60">Calculating costs and quantities...</p>
      </div>
    )
  }

  if (!costData) return null

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Material Cost"
          value={formatINR(costData.subtotal_material)}
          accent={false}
        />
        <SummaryCard
          title="Labor Cost"
          value={formatINR(costData.subtotal_labor)}
          accent={false}
        />
        <Card className="bg-[#C4622D] text-white border-[#C4622D]">
          <CardContent className="p-5">
            <p className="text-sm text-white/70">Grand Total</p>
            <p className="text-2xl font-bold font-heading mt-1 flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />
              {formatINR(costData.grand_total).replace(/₹\s?/, '')}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-white/50">Wastage:</span>
              {editingWastage ? (
                <Input
                  type="number"
                  value={wastageValue}
                  onChange={(e) => setWastageValue(e.target.value)}
                  onBlur={() => handleWastageEdit(wastageValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleWastageEdit(wastageValue)
                    if (e.key === 'Escape') setEditingWastage(false)
                  }}
                  className="h-6 w-16 text-xs text-right bg-white/20 border-white/30 text-white"
                  autoFocus
                  min={0}
                  max={100}
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingWastage(true)
                    setWastageValue(String(costData.wastage_percent))
                  }}
                  className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
                >
                  {costData.wastage_percent}%
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calibration */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCalibration(!showCalibration)}
          className="gap-1.5 text-xs"
        >
          <Ruler className="h-3.5 w-3.5" />
          Calibrate Measurements
        </Button>
        {showCalibration && (
          <div className="flex items-center gap-2 bg-[#1C2B3A]/[0.03] border border-[#1C2B3A]/10 rounded-lg px-3 py-2">
            <span className="text-xs text-[#1C2B3A]/60 whitespace-nowrap">
              Pixels per foot:
            </span>
            <Input
              type="number"
              placeholder="10"
              value={refFeet}
              onChange={(e) => setRefFeet(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCalibrate()
              }}
              className="h-7 w-20 text-xs"
              min={1}
            />
            <Button
              size="sm"
              onClick={handleCalibrate}
              disabled={!refFeet || isLoading}
              className="h-7 text-xs bg-[#C4622D] hover:bg-[#a85225]"
            >
              Recalculate
            </Button>
          </div>
        )}
      </div>

      {/* Cost Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            Detailed Breakdown
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Area</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Mat. Rate</TableHead>
                <TableHead className="text-right">Labor Rate</TableHead>
                <TableHead className="text-right">Mat. Cost</TableHead>
                <TableHead className="text-right">Labor Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costData.line_items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium capitalize whitespace-nowrap">
                    {item.region.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{item.material_name}</TableCell>
                  <TableCell className="text-right">{item.area_sqft.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{item.quantity.toFixed(1)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">
                    {editingCell?.index === i && editingCell.field === 'material_rate' ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleRateEdit(i, 'material_rate', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRateEdit(i, 'material_rate', editValue)
                          if (e.key === 'Escape') setEditingCell(null)
                        }}
                        className="h-7 w-20 text-right text-xs"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCell({ index: i, field: 'material_rate' })
                          setEditValue(String(item.material_rate))
                        }}
                        className="hover:bg-[#C4622D]/10 px-1 py-0.5 rounded text-right w-full"
                      >
                        {item.material_rate}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingCell?.index === i && editingCell.field === 'labor_rate' ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleRateEdit(i, 'labor_rate', editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRateEdit(i, 'labor_rate', editValue)
                          if (e.key === 'Escape') setEditingCell(null)
                        }}
                        className="h-7 w-20 text-right text-xs"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCell({ index: i, field: 'labor_rate' })
                          setEditValue(String(item.labor_rate))
                        }}
                        className="hover:bg-[#C4622D]/10 px-1 py-0.5 rounded text-right w-full"
                      >
                        {item.labor_rate}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatINR(item.material_cost)}</TableCell>
                  <TableCell className="text-right">{formatINR(item.labor_cost)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatINR(item.total_cost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-[#1C2B3A]/50">
        <p>Click any rate or wastage % to edit and recalculate</p>
        <p>All prices in INR</p>
      </div>

      <Button
        onClick={nextStep}
        className="w-full bg-[#C4622D] hover:bg-[#a85225] gap-2"
        size="lg"
      >
        Generate Report
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string
  value: string
  subtitle?: string
  accent: boolean
}) {
  return (
    <Card className={accent ? 'bg-[#C4622D] text-white border-[#C4622D]' : ''}>
      <CardContent className="p-5">
        <p className={`text-sm ${accent ? 'text-white/70' : 'text-[#1C2B3A]/50'}`}>{title}</p>
        <p className="text-2xl font-bold font-heading mt-1 flex items-center gap-1">
          <IndianRupee className="h-5 w-5" />
          {value.replace(/₹\s?/, '')}
        </p>
        {subtitle && (
          <p className={`text-xs mt-1 ${accent ? 'text-white/50' : 'text-[#1C2B3A]/40'}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
