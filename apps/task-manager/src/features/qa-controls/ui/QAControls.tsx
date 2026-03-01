import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { CheckCircle2, XCircle, PauseCircle } from 'lucide-react';

interface Props {
  taskId: string;
}

export const QAControls = ({ taskId }: Props) => {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Human-in-the-Loop QA</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Review Feedback / Instructions</label>
          <Textarea 
            placeholder="Provide feedback to the agent... (e.g., 'The sidebar is slightly misaligned, please fix the padding.')" 
            className="min-h-[150px] resize-none"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle2 className="w-4 h-4" />
          Approve & Mark Done
        </Button>
        <Button variant="destructive" className="w-full sm:w-auto gap-2">
          <XCircle className="w-4 h-4" />
          Reject & Re-assign
        </Button>
        <Button variant="outline" className="w-full sm:w-auto gap-2 ml-auto">
          <PauseCircle className="w-4 h-4" />
          Pause Agent
        </Button>
      </CardFooter>
    </Card>
  );
};
