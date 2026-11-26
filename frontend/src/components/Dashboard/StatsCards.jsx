// src/components/Dashboard/StatsCards.jsx
import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
    ShoppingCart,
    Inventory,
    People,
    AttachMoney,
    TrendingUp,
    Warning
} from '@mui/icons-material';

const StatsCards = ({ stats }) => {
    if (!stats) return null;

    const cards = [
        {
            title: 'إجمالي المنتجات',
            value: stats.total_products || 0,
            icon: <Inventory sx={{ fontSize: 40 }} />,
            color: '#1976d2'
        },
        {
            title: 'قيمة المخزون',
            value: stats.total_value || 0,
            icon: <AttachMoney sx={{ fontSize: 40 }} />,
            color: '#2e7d32'
        },
        {
            title: 'مخزون منخفض',
            value: stats.low_stock_count || 0,
            icon: <Warning sx={{ fontSize: 40 }} />,
            color: '#dc004e'
        },
        {
            title: 'المبيعات اليومية',
            value: stats.daily_sales || 0,
            icon: <TrendingUp sx={{ fontSize: 40 }} />,
            color: '#ed6c02'
        }
    ];

    return (
        <Grid container spacing={3}>
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="h4">
                                        {typeof card.value === 'number' && card.value > 1000 
                                            ? card.value.toLocaleString() 
                                            : card.value}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        backgroundColor: `${card.color}20`,
                                        borderRadius: '50%',
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {React.cloneElement(card.icon, { sx: { color: card.color } })}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default StatsCards;