// src/components/Dashboard/Charts.jsx
import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

const ChartWrapper = ({ title, children }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Box height={300}>
                {children}
            </Box>
        </CardContent>
    </Card>
);

export const SalesChart = ({ data }) => (
    <ChartWrapper title="المبيعات الشهرية">
        <Line
            data={data}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    }
                }
            }}
        />
    </ChartWrapper>
);

export const CategoryChart = ({ data }) => (
    <ChartWrapper title="توزيع المنتجات حسب الفئة">
        <Doughnut
            data={data}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true
                    }
                }
            }}
        />
    </ChartWrapper>
);

export default { SalesChart, CategoryChart };