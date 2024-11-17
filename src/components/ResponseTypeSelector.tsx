import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Code, PenTool, Table, Brain } from 'lucide-react';

export type ResponseType = 'general' | 'coding' | 'creative' | 'data' | 'technical';

interface ResponseTypeSelectorProps {
  value: ResponseType;
  onChange: (value: ResponseType) => void;
}

const responseTypes = [
  { value: 'general', label: 'General Purpose', icon: Brain },
  { value: 'coding', label: 'Code & Programming', icon: Code },
  { value: 'creative', label: 'Creative Writing', icon: PenTool },
  { value: 'data', label: 'Data Analysis', icon: Table },
  { value: 'technical', label: 'Technical Writing', icon: Database },
];

export const ResponseTypeSelector = ({ value, onChange }: ResponseTypeSelectorProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ResponseType)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select response type" />
      </SelectTrigger>
      <SelectContent>
        {responseTypes.map(({ value: typeValue, label, icon: Icon }) => (
          <SelectItem 
            key={typeValue} 
            value={typeValue}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};