import re
import sys

file_path = "naksha-portal/src/app/verify-desk/[id]/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state variables
state_vars = """    const [primaryParty, setPrimaryParty] = useState('');
    const [price, setPrice] = useState<number>(0);
    const [landRate, setLandRate] = useState<number>(0);
    const [currentValue, setCurrentValue] = useState<number>(0);
    const [boundaries, setBoundaries] = useState('');"""
content = re.sub(r"const \[primaryParty, setPrimaryParty\] = useState\(''\);", state_vars, content)

# 2. Populate from API
populate_logic = """                setPrimaryParty(res.data.primary_parties?.[0] || '');
                setPrice(res.data.price_amount || 0);
                setLandRate(res.data.land_rate || 0);
                setCurrentValue(res.data.estimated_current_value || 0);
                setBoundaries(res.data.boundaries ? res.data.boundaries.join(', ') : '');"""
content = re.sub(r"setPrimaryParty\(res\.data\.primary_parties\?\.\[0\] \|\| ''\);", populate_logic, content)

# 3. Add to API request
api_payload = """                primary_parties: [primaryParty],
                price_amount: price,
                land_rate: landRate,
                estimated_current_value: currentValue,
                boundaries: boundaries.split(',').map(s => s.trim()),"""
content = re.sub(r"primary_parties: \[primaryParty\],", api_payload, content)

# 4. Add UI Fields
ui_fields = """                        {/* Form Field */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Area (Acres)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={acres} 
                                onChange={(e) => setAcres(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-800"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Historical Price (₹)</label>
                                <input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Current Day Value (₹) 🤖</label>
                                <input type="number" value={currentValue} onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl focus:outline-none font-mono text-teal-800" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Boundaries (Comma separated)</label>
                            <input type="text" value={boundaries} onChange={(e) => setBoundaries(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                        </div>
"""
content = re.sub(r"\{\/\* Form Field \*\/\}\s*<div>\s*<label className=\"block text-xs font-bold text-slate-500 uppercase mb-2\">Total Area \(Acres\)</label>.*?</div>", ui_fields, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully injected new UI fields!")
