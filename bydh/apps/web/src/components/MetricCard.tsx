import { Card, CardContent, Typography } from '@mui/material'

interface MetricCardProps {
  label: string
  value: string
  helper?: string
  accent?: 'income' | 'expenses' | 'net' | 'investments'
}

export function MetricCard({ label, value, helper, accent }: MetricCardProps) {
  const accentByKey: Record<NonNullable<MetricCardProps['accent']>, string> = {
    income: 'linear-gradient(100deg, rgba(16, 185, 129, 0.18), rgba(52, 211, 153, 0.1))',
    expenses: 'linear-gradient(100deg, rgba(251, 146, 60, 0.2), rgba(254, 215, 170, 0.1))',
    net: 'linear-gradient(100deg, rgba(59, 130, 246, 0.2), rgba(147, 197, 253, 0.12))',
    investments: 'linear-gradient(100deg, rgba(139, 92, 246, 0.2), rgba(196, 181, 253, 0.12))',
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background:
          (accent ? accentByKey[accent] : null) ??
          'linear-gradient(100deg, rgba(15, 118, 110, 0.15), rgba(226, 232, 240, 0.18))',
      }}
    >
      <CardContent>
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography mt={1} variant="h5" fontWeight={700}>
          {value}
        </Typography>
        {helper ? (
          <Typography mt={1} variant="caption" color="text.secondary">
            {helper}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  )
}
