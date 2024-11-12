import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { forwardRef } from "react";

interface ChatSearchProps {
  onSearch: (query: string) => void;
}

export const ChatSearch = forwardRef<HTMLInputElement, ChatSearchProps>(
  ({ onSearch }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          placeholder="Search messages..."
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10"
        />
      </div>
    );
  }
);

ChatSearch.displayName = "ChatSearch";