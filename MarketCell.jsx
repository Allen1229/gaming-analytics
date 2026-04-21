import React, { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';

export default function MarketCell({ row, marketOverrides, setMarketOverrides, marketFilter, setMarketFilter }) {
  const key = row.stableKey;
  const initialValue = marketOverrides[key] || row.market;
  const [val, setVal] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setVal(marketOverrides[key] || row.market);
  }, [marketOverrides, key, row.market]);

  const handleSave = () => {
    setIsEditing(false);
    if (val !== initialValue) {
      setMarketOverrides(prev => ({ ...prev, [key]: val }));
      if (marketFilter === initialValue) {
        setMarketFilter(val);
      }
    }
  };

  const handlePencilClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <input 
        ref={inputRef}
        type="text" 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setIsEditing(true)}
        onBlur={handleSave}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        className={`market-input ${isEditing ? 'editing' : ''}`}
        title="點擊可手動修正市場"
      />
      {!isEditing && (
        <Pencil size={12} onClick={handlePencilClick} style={{ color: '#a0aec0', flexShrink: 0, opacity: 0.6, cursor: 'pointer' }} />
      )}
    </div>
  );
}
