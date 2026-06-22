import { useQuery } from '@tanstack/react-query'
import { loadCoeData } from '../api/coe'
import type { CoeDataset } from '../types'

export function useCoeData() {
  return useQuery<CoeDataset>({
    queryKey: ['coe-data'],
    queryFn: ({ signal }) => loadCoeData(signal),
    staleTime: 1000 * 60 * 60, // COE results update twice a month; 1h is plenty.
    retry: 1,
  })
}
