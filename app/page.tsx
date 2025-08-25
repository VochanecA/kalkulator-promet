'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingDown, TrendingUp, Info, BarChart3, Target, Activity, Zap } from 'lucide-react';
import {
  BarChart as RBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts';

export default function EnhancedVATCalculator() {
  const [inputType, setInputType] = useState<'net' | 'gross'>('net');
  const [initialRevenue, setInitialRevenue] = useState<number>(100000);
  const [revenueDecline, setRevenueDecline] = useState<number>(20);
  const [inflation, setInflation] = useState<number>(0);
  const [showTestCases, setShowTestCases] = useState<boolean>(false);
  const [cumulativeYears, setCumulativeYears] = useState<number>(3);
  const [basePeriod, setBasePeriod] = useState<'monthly' | 'annual'>('monthly');
  
  // New state for Monte Carlo simulation
  const [simulationRuns, setSimulationRuns] = useState<number>(1000);
  const [uncertaintyRange, setUncertaintyRange] = useState<number>(10);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Fix hydration error by ensuring client-side only rendering for random components
  useEffect(() => {
    setIsClient(true);
  }, []);

  const r1 = 0.07; // old VAT
  const r2 = 0.15; // new VAT

  const calculateResults = (
    opts?: { inputType?: 'net' | 'gross'; initialRevenue?: number; revenueDecline?: number; inflation?: number }
  ) => {
    const type = opts?.inputType ?? inputType;
    const baseRevenue = opts?.initialRevenue ?? initialRevenue;
    const d = (opts?.revenueDecline ?? revenueDecline) / 100;
    const p = (opts?.inflation ?? inflation) / 100;

    const baseNet = type === 'net' ? baseRevenue : baseRevenue / (1 + r1);
    const baseGross = type === 'net' ? baseNet * (1 + r1) : baseRevenue;
    const oldVAT = baseNet * r1;

    let declinedNetRevenue: number;
    let declinedGrossRevenue: number;
    let newVAT: number;
    let breakEvenDecline: number;

    if (type === 'net') {
      const inflatedNet = baseNet * (1 + p);
      const declinedNet = inflatedNet * (1 - d);
      declinedNetRevenue = declinedNet;
      declinedGrossRevenue = declinedNet * (1 + r2);
      newVAT = declinedNet * r2;
      breakEvenDecline = 100 * (1 - (r1 / (r2 * (1 + p))));
    } else {
      const inflatedGross = baseGross * (1 + p);
      const declinedGross = inflatedGross * (1 - d);
      declinedGrossRevenue = declinedGross;
      declinedNetRevenue = declinedGross / (1 + r2);
      newVAT = declinedGross * (r2 / (1 + r2));
      breakEvenDecline = 100 * (1 - ((r1 / (1 + r1)) / ((1 + p) * (r2 / (1 + r2)))));
    }

    const difference = newVAT - oldVAT;
    const percentageChange = oldVAT === 0 ? 0 : ((newVAT - oldVAT) / oldVAT) * 100;

    // NEW: Economic indicators
    const vatRateChange = ((r2 - r1) / r1) * 100; // VAT rate increase percentage
    const demandElasticity = d > 0 ? -(d * 100) / vatRateChange : 0; // Price elasticity approximation
    const revenueEfficiency = newVAT / oldVAT; // Revenue efficiency ratio
    const deadweightLoss = baseNet * d * (r2 - r1) * 0.5; // Approximation of economic deadweight loss

    return {
      netRevenue: baseNet,
      grossRevenue: baseGross,
      declinedNetRevenue,
      declinedGrossRevenue,
      oldVAT,
      newVAT,
      difference,
      percentageChange,
      breakEvenDecline,
      demandElasticity,
      revenueEfficiency,
      deadweightLoss,
      vatRateChange
    };
  };

  // NEW: Monte Carlo simulation - only run on client side
  const runMonteCarloSimulation = () => {
    if (!isClient) {
      // Return default values for server-side rendering
      return {
        results: [],
        statistics: {
          average: results.difference,
          median: results.difference,
          p5: results.difference,
          p95: results.difference,
          standardDeviation: 0
        }
      };
    }

    const simulationResults = [];
    const baseDecline = revenueDecline;
    
    for (let i = 0; i < simulationRuns; i++) {
      // Generate random decline within uncertainty range
      const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
      const simulatedDecline = Math.max(0, Math.min(80, 
        baseDecline + (randomFactor * uncertaintyRange)
      ));
      
      const result = calculateResults({ revenueDecline: simulatedDecline });
      simulationResults.push({
        run: i + 1,
        decline: simulatedDecline,
        difference: result.difference,
        newVAT: result.newVAT
      });
    }
    
    // Calculate statistics
    const differences = simulationResults.map(r => r.difference);
    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
    const sortedDiffs = [...differences].sort((a, b) => a - b);
    const p5 = sortedDiffs[Math.floor(simulationRuns * 0.05)];
    const p95 = sortedDiffs[Math.floor(simulationRuns * 0.95)];
    const median = sortedDiffs[Math.floor(simulationRuns * 0.5)];
    
    return {
      results: simulationResults.slice(0, 100), // Show only first 100 for visualization
      statistics: {
        average: avgDifference,
        median,
        p5,
        p95,
        standardDeviation: Math.sqrt(differences.reduce((sum, x) => sum + Math.pow(x - avgDifference, 2), 0) / differences.length)
      }
    };
  };

  const results = calculateResults();
  const simulation = runMonteCarloSimulation();

  const chartData = [
    { name: 'PDV prije (7%)', value: results.oldVAT, color: '#ef4444' },
    { name: 'PDV poslije (15%)', value: results.newVAT, color: '#22c55e' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-blue-600">
            <span className="font-medium">PDV: </span>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const testCases = [
    { decline: 10, description: 'Blagi pad prometa' },
    { decline: 20, description: 'Umeren pad prometa' },
    { decline: 30, description: 'Značajan pad prometa' },
    { decline: 40, description: 'Veliki pad prometa' },
    { decline: 50, description: 'Drastičan pad prometa' }
  ];

  const perYearDifference = basePeriod === 'monthly' ? results.difference * 12 : results.difference;

  const cumulativeData = Array.from({ length: cumulativeYears }, (_, i) => {
    const year = i + 1;
    return {
      year: `Godina ${year}`,
      cumulative: perYearDifference * year
    };
  });

  const sensitivityData = Array.from({ length: 21 }, (_, i) => {
    const decline = i * 4;
    const res = calculateResults({ revenueDecline: decline });
    return { decline, difference: res.difference };
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="relative">
              <Calculator className="h-12 w-12 text-indigo-600" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Napredni PDV Kalkulator
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-4">
            Sveobuhvatan alat za analizu ekonomskog uticaja promjene PDV stope sa{' '}
            <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded">7%</span> na{' '}
            <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">15%</span>
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>Ekonomski indikatori</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Monte Carlo simulacija</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>Napredna analiza</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Input Section */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Parametri kalkulacije
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-6">
                {/* Input Type */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-slate-900">Tip unosa prometa</Label>
                  <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'net' | 'gross')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
                      <TabsTrigger 
                        value="net" 
                        className="text-sm transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                      >
                        Bez PDV-a
                      </TabsTrigger>
                      <TabsTrigger 
                        value="gross" 
                        className="text-sm transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                      >
                        Sa PDV-om
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      {inputType === 'net'
                        ? '💡 Unosite osnovicu (bez PDV-a) - kalkulator će dodati odgovarajući PDV'
                        : '💡 Unosite bruto iznos (sa 7% PDV) - kalkulator će izdvojiti osnovicu'}
                    </p>
                  </div>
                </div>

                {/* Enhanced Revenue Input */}
                <div className="space-y-3">
                  <Label htmlFor="revenue" className="text-base font-semibold text-slate-900">
                    Početni promet
                  </Label>
                  <div className="relative group">
                    <Input
                      id="revenue"
                      type="number"
                      value={initialRevenue}
                      onChange={(e) => setInitialRevenue(Number(e.target.value))}
                      className="text-lg font-semibold pr-16 border-2 focus:border-indigo-500 transition-all group-hover:shadow-md"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-600">
                      EUR
                    </div>
                  </div>
                </div>

                {/* Enhanced Decline Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold text-slate-900">Pad prometa</Label>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 px-3 py-2 rounded-full border border-red-200">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="font-bold text-red-600 text-lg">{revenueDecline}%</span>
                    </div>
                  </div>
                  <div className="px-2">
                    <Slider 
                      value={[revenueDecline]} 
                      onValueChange={(v) => setRevenueDecline(v[0])} 
                      max={80} 
                      step={1} 
                      className="slider-enhanced"
                    />
                  </div>
                </div>

                {/* Enhanced Inflation Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold text-slate-900">Inflacija</Label>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${inflation > 0 ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                      <TrendingUp className={`h-4 w-4 ${inflation > 0 ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span className={`font-bold text-lg ${inflation > 0 ? 'text-orange-600' : 'text-slate-600'}`}>{inflation}%</span>
                    </div>
                  </div>
                  <div className="px-2">
                    <Slider 
                      value={[inflation]} 
                      onValueChange={(v) => setInflation(v[0])} 
                      max={50} 
                      step={1}
                      className="slider-enhanced"
                    />
                  </div>
                </div>

                {/* NEW: Monte Carlo Controls */}
                <div className="space-y-4 border-t pt-6">
                  <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    Monte Carlo simulacija
                  </Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-slate-700">Opseg nesigurnosti (±%)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Slider 
                          value={[uncertaintyRange]} 
                          onValueChange={(v) => setUncertaintyRange(v[0])} 
                          max={20} 
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-semibold text-indigo-600 min-w-[3rem]">±{uncertaintyRange}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all">
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-red-600 text-sm font-semibold">PDV prije (7%)</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <div className="text-xl font-bold text-red-700">{formatCurrency(results.oldVAT)}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all">
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-green-600 text-sm font-semibold">PDV poslije (15%)</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <div className="text-xl font-bold text-green-700">{formatCurrency(results.newVAT)}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-blue-600 text-sm font-semibold">Razlika</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <div className="text-xl font-bold text-blue-700">
                    {results.difference >= 0 ? '+' : ''}{formatCurrency(results.difference)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all">
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-purple-600 text-sm font-semibold">Promjena (%)</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <div className="text-xl font-bold text-purple-700">
                    {results.percentageChange >= 0 ? '+' : ''}{results.percentageChange.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NEW: Economic Indicators */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                  <Target className="h-5 w-5" />
                  Ekonomski indikatori
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">
                      {Math.abs(results.demandElasticity).toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-700 font-medium">Elastičnost potražnje</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {Math.abs(results.demandElasticity) > 1 ? 'Elastična' : 'Neelastična'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {results.revenueEfficiency.toFixed(2)}x
                    </div>
                    <div className="text-sm text-slate-700 font-medium">Efikasnost prihoda</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {results.revenueEfficiency > 1 ? 'Povećanje' : 'Smanjenje'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {formatCurrency(results.deadweightLoss)}
                    </div>
                    <div className="text-sm text-slate-700 font-medium">Deadweight gubitak</div>
                    <div className="text-xs text-slate-500 mt-1">Ekonomska neefikasnost</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Bar Chart */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Poređenje PDV naplate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#dc2626" stopOpacity={0.9}/>
                        </linearGradient>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0.9}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-0} 
                        textAnchor="end" 
                        height={70}
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <YAxis 
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        <Cell fill="url(#redGradient)" />
                        <Cell fill="url(#greenGradient)" />
                      </Bar>
                    </RBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* NEW: Monte Carlo Simulation Results - Only show on client */}
            {isClient && (
              <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-700">
                    <Activity className="h-5 w-5" />
                    Monte Carlo simulacija rezultati
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-700">Statistički pokazatelji</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Prosjek:</span>
                          <span className="font-semibold">{formatCurrency(simulation.statistics.average)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Medijan:</span>
                          <span className="font-semibold">{formatCurrency(simulation.statistics.median)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>5. percentil:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(simulation.statistics.p5)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>95. percentil:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(simulation.statistics.p95)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Std. devijacija:</span>
                          <span className="font-semibold">{formatCurrency(simulation.statistics.standardDeviation)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-48">
                      <h4 className="font-semibold mb-3 text-slate-700">Distribucija rezultata</h4>
                      {simulation.results.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart data={simulation.results.slice(0, 50)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="decline" 
                              domain={['dataMin - 2', 'dataMax + 2']}
                              tickFormatter={(v) => `${v.toFixed(0)}%`}
                            />
                            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip 
                              formatter={(val: any, name: string) => [
                                name === 'difference' ? formatCurrency(val) : val.toFixed(1) + '%',
                                name === 'difference' ? 'PDV razlika' : 'Pad prometa'
                              ]}
                            />
                            <Scatter dataKey="difference" fill="#3b82f6" fillOpacity={0.6} />
                            <ReferenceLine 
                              y={simulation.statistics.average} 
                              stroke="#ef4444" 
                              strokeDasharray="5 5" 
                              label="Prosjek"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading placeholder for server-side rendering */}
            {!isClient && (
              <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-700">
                    <Activity className="h-5 w-5" />
                    Monte Carlo simulacija rezultati
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48">
                    <div className="text-slate-500">Učitava se simulacija...</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Test Cases */}
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowTestCases(!showTestCases)} 
                variant="outline"
                className="bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 text-indigo-700 font-semibold px-6 py-2 transition-all"
              >
                {showTestCases ? 'Sakrij' : 'Prikaži'} test scenarije
              </Button>
            </div>

            {showTestCases && (
              <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="text-indigo-700">Test scenariji</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testCases.map((tc, i) => {
                      const res = calculateResults({ revenueDecline: tc.decline });
                      return (
                        <div key={i} className="flex justify-between items-center bg-white/80 p-4 rounded-lg border border-indigo-100 hover:shadow-md transition-all">
                          <div>
                            <span className="font-semibold text-slate-800">{tc.description}</span>
                            <span className="text-sm text-slate-600 ml-2">({tc.decline}%)</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-600">
                              {formatCurrency(res.oldVAT)} → {formatCurrency(res.newVAT)}
                            </div>
                            <div className="text-sm font-semibold text-indigo-600">
                              {res.difference >= 0 ? '+' : ''}{formatCurrency(res.difference)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Break-even & Model assumptions cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <Info className="h-5 w-5" />
                    Kritični pad (break-even)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-amber-600 mb-2">
                      {results.breakEvenDecline.toFixed(1)}%
                    </div>
                    <p className="text-sm text-slate-700">
                      Pad prometa potreban da bi PDV naplata ostala ista kao pri stopi od 7%
                    </p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <p className="text-xs text-amber-800">
                      💡 <strong>Objašnjenje:</strong> Ako pad prometa bude manji od ove vrijednosti, 
                      država će naplatiti više PDV-a uprkos padu aktivnosti.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-700">Pretpostavke modela</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Stope PDV-a: 7% → 15% (fiksne vrijednosti)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Pad prometa je procjena nakon implementacije nove stope</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Inflacija se aplicira prije kalkulacije PDV-a</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Monte Carlo simulacija uzima u obzir nesigurnost procjene</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Ekonomski indikatori su aproksimacije za analizu</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Cumulative Effect Over Time */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Kumulativni efekat kroz vrijeme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="text-sm font-medium text-slate-700">Osnova perioda:</span>
                  <Tabs value={basePeriod} onValueChange={(v) => setBasePeriod(v as 'monthly' | 'annual')}>
                    <TabsList className="bg-slate-100 p-1">
                      <TabsTrigger 
                        value="monthly" 
                        className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                      >
                        📅 Mjesečno
                      </TabsTrigger>
                      <TabsTrigger 
                        value="annual" 
                        className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                      >
                        📊 Godišnje
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="ml-auto flex gap-2">
                    {[1, 3, 5].map((y) => (
                      <Button
                        key={y}
                        variant={y === cumulativeYears ? 'default' : 'outline'}
                        onClick={() => setCumulativeYears(y)}
                        className={`px-4 transition-all ${
                          y === cumulativeYears 
                            ? 'bg-indigo-600 hover:bg-indigo-700' 
                            : 'hover:bg-indigo-50 hover:border-indigo-200'
                        }`}
                        size="sm"
                      >
                        {y} {y === 1 ? 'godina' : 'godine'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RBarChart data={cumulativeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <YAxis 
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                      <Bar dataKey="cumulative" fill="url(#cumulativeGradient)" radius={[4, 4, 0, 0]} />
                    </RBarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    📈 <strong>Analiza:</strong> Grafikon prikazuje akumulaciju razlike u PDV naplati tokom vremena. 
                    {basePeriod === 'monthly' 
                      ? ' Godišnji efekat se računa kao 12 × mjesečna razlika.' 
                      : ' Prikazana je direktna akumulacija godišnjih efekata.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Sensitivity Analysis */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Sensitivity analiza (šta-ako scenariji)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensitivityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="sensitivityGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                          <stop offset="50%" stopColor="#3b82f6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="decline" 
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <YAxis 
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <Tooltip
                        formatter={(val: any) => formatCurrency(val)}
                        labelFormatter={(v) => `Pad prometa: ${v}%`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="difference" 
                        stroke="url(#sensitivityGradient)" 
                        strokeWidth={4} 
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} 
                        activeDot={{ r: 6, fill: '#1d4ed8' }}
                      />
                      <ReferenceLine 
                        x={revenueDecline} 
                        stroke="#ef4444" 
                        strokeDasharray="5 5" 
                        label={{ value: "Trenutna procjena", position: "top" }}
                      />
                      <ReferenceLine 
                        y={0} 
                        stroke="#64748b" 
                        strokeDasharray="2 2"
                        label={{ value: "Break-even", position: "top" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">
                    🎯 <strong>Objašnjenje:</strong> Krivulja pokazuje kako se PDV naplata mijenja ovisno o intenzitetu 
                    pada prometa. Crvena linija označava vašu trenutnu procjenu, a siva linija predstavlja break-even tačku 
                    gdje je naplata jednaka kao pri staroj stopi od 7%.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-3">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Precizna kalkulacija</h3>
                <p className="text-sm text-slate-600 text-center">
                  Matematički tačne formule za sve scenarije
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-3">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Napredna analiza</h3>
                <p className="text-sm text-slate-600 text-center">
                  Monte Carlo simulacija i ekonomski indikatori
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Vizuelni pristup</h3>
                <p className="text-sm text-slate-600 text-center">
                  Interaktivni grafici i intuitivan interfejs
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-6 rounded-xl border border-indigo-200 mb-6">
              <p className="text-slate-600 mb-4 leading-relaxed">
                🔍 <strong>Sveobuhvatan alat</strong> koji omogućava duboku analizu ekonomskih efekata promjene PDV stope.
                Uključuje uncertainty modeling, ekonomske indikatore i scenario planning.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Besplatan pristup</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Po ideji @Fidelity_cg Code by @Boreas_MN</span>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Open source</span>
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Real-time rezultati</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 p-4 rounded-lg">
              <p className="text-sm text-slate-600 font-medium">
                💡 <strong>Ekonomski zaključak:</strong> Značajan pad prometa u ugostiteljstvu je &quot;prihvatljiv&quot;; 
                za državu jer udvostručena stopa PDV-a i dalje obezbijeđuje veću naplatu, 
                što pokazuju i Monte Carlo simulacije sa različitim scenarijima nesigurnosti.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-enhanced .rc-slider-track {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          height: 6px;
        }
        .slider-enhanced .rc-slider-handle {
          border: 2px solid #3b82f6;
          background: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .slider-enhanced .rc-slider-rail {
          background: #e2e8f0;
          height: 6px;
        }
      `}</style>
    </div>
  );
}