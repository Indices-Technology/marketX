import type { CarrierPolicy } from '../../utils/types'

/** GIG Logistics policy — derived from the GIG SLA (see docs/SHIPPING.md §13). */
export const gigPolicy: CarrierPolicy = {
  claimsWindowHours: 24, // §10.3
  liabilityCap: 'declared', // §10.2 — limited to declared value
  returnTariffApplies: true, // §1.10, §9
  settlementModels: ['ESCROW_POD', 'CARRIER_COD'],
  codRemittanceDays: 7, // §4.6 — weekly remittance
  maxWeightKg: 200, // Annexure 2 tops out at 200kg
  prohibitedItems: [
    'cash',
    'dangerous goods',
    'flammable liquids',
    'flammable solids',
    'gases',
    'oxidizers',
    'organic peroxides',
    'corrosive materials',
    'radioactive materials',
    'poisonous or infectious substances',
  ],
}
