import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ChatExport({ messages }: { messages: any[] }) {
  const exportToMarkdown = () => {
    const markdown = messages
      .map((msg) => `**${msg.role}**: ${msg.content}\n`)
      .join("\n");
    
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-export.md";
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Chat Exported",
      description: "Your chat history has been exported as Markdown",
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToMarkdown}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export Chat
    </Button>
  );
}