import { ReportProblemButton } from './ReportProblemButton';

export default {
  title: 'ReportProblemButton',
};

// Shown as it appears in the app header. Opening the dialog and sending a
// report is covered by ReportProblemButton.test.tsx, not by this visual-only story.
export const Default = () => (
  <div className="flex justify-end p-4">
    <ReportProblemButton />
  </div>
);
