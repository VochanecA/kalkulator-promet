'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingDown, TrendingUp, Info, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function VATCalculator() {
  const [inputType, setInputType] = useState<'net' | 'gross'>('net');
  const [initialRevenue, setInitialRevenue] = useState<number>(100000);
  const [revenueDecline, setRevenueDecline] = useState<number>(20);
  const [inflation, setInflation] = useState<number>(0);
  const [showTestCases, setShowTestCases] = useState<boolean>(false);

  // Calculation functions
  const calculateResults = () => {
    let netRevenue = initialRevenue;
    
    if (inputType === 'gross') {
      // Convert gross to net (assuming 7% VAT originally)
      netRevenue = initialRevenue / 1.07;
    }
    
    // Apply inflation to prices (affects the base)
    const inflatedNetRevenue = netRevenue * (1 + inflation / 100);
    
    // Apply revenue decline
    const declinedRevenue = inflatedNetRevenue * (1 - revenueDecline / 100);
    
    // Calculate VAT amounts
    const oldVAT = netRevenue * 0.07; // 7% on original revenue
    const newVAT = declinedRevenue * 0.15; // 15% on declined revenue
    
    const difference = newVAT - oldVAT;
    const percentageChange = ((newVAT - oldVAT) / oldVAT) * 100;
    
    // Calculate break-even point
    // At break-even: netRevenue * 0.07 = declinedRevenue * 0.15
    // netRevenue * 0.07 = netRevenue * (1 + inflation/100) * (1 - breakEven/100) * 0.15
    // 0.07 = (1 + inflation/100) * (1 - breakEven/100) * 0.15
    // (1 - breakEven/100) = 0.07 / (0.15 * (1 + inflation/100))
    // breakEven = 100 * (1 - 0.07 / (0.15 * (1 + inflation/100)))
    
    const inflationMultiplier = 1 + inflation / 100;
    const breakEvenDecline = 100 * (1 - 0.07 / (0.15 * inflationMultiplier));
    
    return {
      netRevenue: Math.round(netRevenue),
      grossRevenue: Math.round(netRevenue * 1.07),
      declinedNetRevenue: Math.round(declinedRevenue),
      declinedGrossRevenue: Math.round(declinedRevenue * 1.15),
      oldVAT: Math.round(oldVAT),
      newVAT: Math.round(newVAT),
      difference: Math.round(difference),
      percentageChange: Math.round(percentageChange * 100) / 100,
      breakEvenDecline: Math.round(breakEvenDecline * 100) / 100
    };
  };

  const results = calculateResults();

  // Prepare chart data
  const chartData = [
    {
      name: 'PDV prije (7%)',
      value: results.oldVAT,
      color: '#ef4444',
      label: 'Stara stopa'
    },
    {
      name: 'PDV poslije (15%)',
      value: results.newVAT,
      color: '#22c55e',
      label: 'Nova stopa'
    }
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
    { decline: 10, description: "Blagi pad prometa" },
    { decline: 20, description: "Umeren pad prometa" },
    { decline: 30, description: "Značajan pad prometa" },
    { decline: 40, description: "Veliki pad prometa" },
    { decline: 50, description: "Drastičan pad prometa" }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Calculator className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">
              Kalkulator pada prometa i PDV naplate
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Poređenje naplate PDV-a pri promjeni stope sa <span className="font-semibold text-red-600">7%</span> na{' '}
            <span className="font-semibold text-green-600">15%</span>, uz zadati pad prometa i inflaciju.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Parametri kalkulacije
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Input Type Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-slate-900">Tip unosa prometa</Label>
                  <Tabs value={inputType} onValueChange={(value) => setInputType(value as 'net' | 'gross')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                      <TabsTrigger value="net" className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        Bez PDV-a (osnovica)
                      </TabsTrigger>
                      <TabsTrigger value="gross" className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        Sa PDV-om (bruto)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {inputType === 'net' 
                        ? 'Ako unosite iznose faktura prije promjene stope, sa PDV-om odgovara bruto prometu sa stopom 7%. Ako unosite osnovice, odaberite bez PDV-a.'
                        : 'Unosite bruto promet sa PDV-om od 7%. Kalkulator će automatski odvojiti osnovicu i PDV.'
                      }
                    </p>
                  </div>
                </div>

                {/* Initial Revenue */}
                <div className="space-y-3">
                  <Label htmlFor="revenue" className="text-base font-semibold text-slate-900">
                    Početni promet (prije promjene stope)
                  </Label>
                  <div className="relative">
                    <Input
                      id="revenue"
                      type="number"
                      value={initialRevenue}
                      onChange={(e) => setInitialRevenue(Number(e.target.value))}
                      className="text-lg font-semibold pr-12 border-2 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">
                      EUR
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {inputType === 'net' ? 'Neto:' : 'Bruto:'} {formatCurrency(initialRevenue)}
                  </p>
                </div>

                {/* Revenue Decline Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold text-slate-900">
                      Pad prometa nakon promjene stope
                    </Label>
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="font-bold text-red-600">{revenueDecline}%</span>
                    </div>
                  </div>
                  <Slider
                    value={[revenueDecline]}
                    onValueChange={(value) => setRevenueDecline(value[0])}
                    max={80}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-slate-600">
                    Procijenjeni pad prometa usljed povećanja stope (i promjena potražnje).
                  </p>
                </div>

                {/* Inflation Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold text-slate-900">
                      Inflacija cijena (opciono)
                    </Label>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${inflation > 0 ? 'bg-orange-50' : 'bg-slate-50'}`}>
                      <TrendingUp className={`h-4 w-4 ${inflation > 0 ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span className={`font-bold ${inflation > 0 ? 'text-orange-600' : 'text-slate-600'}`}>
                        {inflation}%
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[inflation]}
                    onValueChange={(value) => setInflation(value[0])}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-slate-600">
                    Primjenjuje se na isti tip prometa koji ste odabrali (neto ili bruto) za poslje promjene stope.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Main Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Old VAT */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4 text-center">
                    <CardTitle className="text-red-600 text-lg">PDV prije (7%)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {formatCurrency(results.oldVAT)}
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Osnovica: {formatCurrency(results.netRevenue)}</p>
                      <p>Bruto: {formatCurrency(results.grossRevenue)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* New VAT */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4 text-center">
                    <CardTitle className="text-green-600 text-lg">PDV poslije (15%)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {formatCurrency(results.newVAT)}
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Osnovica: {formatCurrency(results.declinedNetRevenue)}</p>
                      <p>Bruto: {formatCurrency(results.declinedGrossRevenue)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Difference */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4 text-center">
                    <CardTitle className={`text-lg ${results.difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      Razlika ({results.difference >= 0 ? 'više' : 'manje'} naplate)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${results.difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {results.difference >= 0 ? '+' : ''}{formatCurrency(results.difference)}
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Promjena PDV-a: {results.percentageChange >= 0 ? '+' : ''}{results.percentageChange}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bar Chart Visualization */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Vizuelno poređenje PDV naplate
                  </CardTitle>
                  <CardDescription>
                    Grafički prikaz razlike u naplati PDV-a između stare (7%) i nove (15%) stope
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                        barCategoryGap="30%"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Chart Summary */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-red-600 font-semibold text-sm mb-1">Stara stopa (7%)</div>
                      <div className="text-2xl font-bold text-red-700">{formatCurrency(results.oldVAT)}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-green-600 font-semibold text-sm mb-1">Nova stopa (15%)</div>
                      <div className="text-2xl font-bold text-green-700">{formatCurrency(results.newVAT)}</div>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${results.difference >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                      <div className={`font-semibold text-sm mb-1 ${results.difference >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {results.difference >= 0 ? 'Više naplate' : 'Manje naplate'}
                      </div>
                      <div className={`text-2xl font-bold ${results.difference >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                        {results.difference >= 0 ? '+' : ''}{formatCurrency(results.difference)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <strong>Napomena:</strong> Grafik prikazuje apsolutne iznose PDV-a. 
                      {results.difference >= 0 
                        ? ` Uprkos padu prometa od ${revenueDecline}%, država i dalje naplaćuje više PDV-a zbog povećanja stope.`
                        : ` Pad prometa od ${revenueDecline}% je dovoljno veliki da smanji ukupnu naplatu PDV-a uprkos povećanju stope.`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Break-even Analysis */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Info className="h-5 w-5 text-blue-600" />
                    Kritični pad (break-even)
                  </CardTitle>
                  <CardDescription>
                    Da bi država naplatila <span className="font-semibold">isto</span> PDV-a kao pri stopi 7%, pad prometa bi morao biti{' '}
                    <span className="font-bold text-blue-600">{results.breakEvenDecline}%</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Napomena:</strong> Formula zavisi od toga da li unosite neto (osnovicu) ili bruto (sa PDV-om) promet prije promjene stope.
                    </p>
                    <div className="text-xs text-blue-700">
                      Break-even za neto unos ≈ 53,3% | Break-even za bruto unos ≈ 49,8% (bez inflacije)
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Assumptions */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-slate-900">Pretpostavke modela</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Stope PDV-a su fiksne: 7% → 15%.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Pad prometa je projeka nakon promjene stope.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Inflacija je opcionalna i primjenjuje se na isti tip prometa koji ste izabrali (neto ili bruto).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Za prikaz PDV-a računamo osnovicu (neto) i odgovarajući bruto.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Rezultati su indikativni i zavise od unijetih pretpostavki.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Test Cases */}
              <div className="flex justify-center">
                <Button 
                  onClick={() => setShowTestCases(!showTestCases)}
                  variant="outline"
                  size="lg"
                  className="bg-white hover:bg-slate-50 border-2 border-slate-200"
                >
                  {showTestCases ? 'Sakrij' : 'Prikaži'} test slučajeve
                </Button>
              </div>

              {showTestCases && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Test slučajevi</CardTitle>
                    <CardDescription>
                      Primjeri sa vašim početnim prometom od {formatCurrency(initialRevenue)} i inflacijom od {inflation}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testCases.map((testCase, index) => {
                        const oldDecline = revenueDecline;
                        const testResults = (() => {
                          // Temporarily calculate with test case values
                          let netRevenue = initialRevenue;
                          if (inputType === 'gross') {
                            netRevenue = initialRevenue / 1.07;
                          }
                          const inflatedNetRevenue = netRevenue * (1 + inflation / 100);
                          const declinedRevenue = inflatedNetRevenue * (1 - testCase.decline / 100);
                          const oldVAT = netRevenue * 0.07;
                          const newVAT = declinedRevenue * 0.15;
                          const difference = newVAT - oldVAT;
                          
                          return {
                            oldVAT: Math.round(oldVAT),
                            newVAT: Math.round(newVAT),
                            difference: Math.round(difference)
                          };
                        })();

                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => setRevenueDecline(testCase.decline)}
                          >
                            <div>
                              <div className="font-semibold text-slate-900">
                                {testCase.description} ({testCase.decline}%)
                              </div>
                              <div className="text-sm text-slate-600">
                                PDV: {formatCurrency(testResults.oldVAT)} → {formatCurrency(testResults.newVAT)}
                              </div>
                            </div>
                            <div className={`font-bold ${testResults.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {testResults.difference >= 0 ? '+' : ''}{formatCurrency(testResults.difference)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200">
          <p className="text-slate-600 mb-4">
            🔍 Alat je dostupan online, besplatno, i omogućava svima da vide kako povećanje stope PDV-a utiče u praksi.
          </p>
          <p className="text-sm text-slate-500">
            <strong>Zaključak:</strong> evidentan pad prometa u restoranima i hotelima je prihvatljiv za Vladu za bolju naplatu PDV-a, 
            jer je stopa PDV-a više nego udvostučena.
          </p>
        </div>
      </div>
    </div>
  );
}