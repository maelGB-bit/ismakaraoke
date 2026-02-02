import { Volume2, VolumeX } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface VotingPreferenceToggleProps {
  allowVoting: boolean;
  onChange: (allowVoting: boolean) => void;
  disabled?: boolean;
}

export function VotingPreferenceToggle({ allowVoting, onChange, disabled = false }: VotingPreferenceToggleProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        🎤 Votação desta apresentação
      </Label>
      <RadioGroup
        value={allowVoting ? 'allow' : 'deny'}
        onValueChange={(value) => onChange(value === 'allow')}
        className="flex gap-4"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="allow" id="toggle-allow-voting" disabled={disabled} />
          <Label 
            htmlFor="toggle-allow-voting" 
            className={`flex items-center gap-1.5 cursor-pointer text-sm ${disabled ? 'opacity-50' : ''}`}
          >
            <Volume2 className="h-3.5 w-3.5 text-green-500" />
            <span>Quero ser votado</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="deny" id="toggle-deny-voting" disabled={disabled} />
          <Label 
            htmlFor="toggle-deny-voting" 
            className={`flex items-center gap-1.5 cursor-pointer text-sm ${disabled ? 'opacity-50' : ''}`}
          >
            <VolumeX className="h-3.5 w-3.5 text-orange-500" />
            <span>Não quero ser votado</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
