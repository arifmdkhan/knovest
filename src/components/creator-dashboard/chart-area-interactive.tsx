"use client"


import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import React from "react"


export const description = "An interactive area chart"

const enrollmentsData = [
  // Week 1
  { date: '2025-05-01', enrollments: 65 },
  { date: '2025-05-02', enrollments: 58 },
  { date: '2025-05-03', enrollments: 28 }, // Weekend dip
  { date: '2025-05-04', enrollments: 24 }, // Weekend dip
  { date: '2025-05-05', enrollments: 45 },
  { date: '2025-05-06', enrollments: 72 },
  { date: '2025-05-07', enrollments: 85 },
  { date: '2025-05-08', enrollments: 62 },
  { date: '2025-05-09', enrollments: 55 },

  // Week 2 (Includes your specific data points)
  { date: '2025-05-10', enrollments: 32 },
  { date: '2025-05-11', enrollments: 22 },
  { date: '2025-05-12', enrollments: 14 },
  { date: '2025-05-13', enrollments: 43 },
  { date: '2025-05-14', enrollments: 79 }, // Peak
  { date: '2025-05-15', enrollments: 67 },
  { date: '2025-05-16', enrollments: 58 },

  // Week 3
  { date: '2025-05-17', enrollments: 25 }, // Weekend dip
  { date: '2025-05-18', enrollments: 18 }, // Weekend dip
  { date: '2025-05-19', enrollments: 38 },
  { date: '2025-05-20', enrollments: 65 },
  { date: '2025-05-21', enrollments: 88 }, // Peak
  { date: '2025-05-22', enrollments: 71 },
  { date: '2025-05-23', enrollments: 54 },

  // Week 4
  { date: '2025-05-24', enrollments: 30 }, // Weekend dip
  { date: '2025-05-25', enrollments: 26 }, // Weekend dip
  { date: '2025-05-26', enrollments: 48 },
  { date: '2025-05-27', enrollments: 75 },
  { date: '2025-05-28', enrollments: 92 }, // Month High
  { date: '2025-05-29', enrollments: 81 },
  { date: '2025-05-30', enrollments: 60 },
  { date: '2025-05-31', enrollments: 35 },
];


const chartConfig = {
  enrollments: {
    label: 'Enrollments',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig


interface ChartAreaInteractiveProps {

  data: {
    date: string;
    enrollments: number
  }[]

}

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const totalEnrollments=React.useMemo(()=>{
    return data.reduce((total, item) => total + item.enrollments, 0)
  },[data])




  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Enrollments</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Total Enrollment for the last 30 days: {totalEnrollments}</span>
          <span className="@[540px]/card:hidden">Last 30 days: {totalEnrollments}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            data={data}
            margin={{
              left: 12,
              right: 12
            }}>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={'preserveStartEnd'}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              }}
            />
            <ChartTooltip content={
              <ChartTooltipContent
                className="w-[150px]"
                labelFormatter={
                  (value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  }
                }
              />
            } />
            <Bar dataKey={"enrollments"} fill="var(--color-enrollments)" />

          </BarChart>

        </ChartContainer>
      </CardContent>
    </Card>
  )
}
