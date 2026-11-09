import React from 'react';
import { TestQuestion, QuestionType } from '../../types';
import QuestionShell from './QuestionShell';
import ChoiceQuestion from './ChoiceQuestion';
import ImageQuestion from './ImageQuestion';
import MultiQuestion from './MultiQuestion';
import FillQuestion from './FillQuestion';
import MatchQuestion from './MatchQuestion';
import OrderQuestion from './OrderQuestion';
import TerminalQuestion from './TerminalQuestion';

interface QuestionRendererProps {
  question: TestQuestion;
  questionNumber: number;
  totalQuestions: number;
  value: any;
  onChange: (val: any) => void;
  onSubmitAnswer?: () => void;
  mode: 'practice' | 'exam' | 'setup' | 'domain-drill';
  reviewMode: boolean;
  isAnswered: boolean;
  isCorrect: boolean | null;
  accentColor: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionNumber,
  totalQuestions,
  value,
  onChange,
  onSubmitAnswer,
  mode,
  reviewMode,
  isAnswered,
  isCorrect,
  accentColor
}) => {
  const qType: QuestionType = question.type || 'choice';

  // Disabled when in review mode or when already answered in practice mode
  const isDisabled = reviewMode || (mode === 'practice' && isAnswered);

  // Show immediate feedback banner in practice mode once answered, or in review mode
  const showFeedback = reviewMode || (mode === 'practice' && isAnswered);

  // Show detailed correctness cues on options/fields
  const showCorrectness = reviewMode || (mode === 'practice' && isAnswered);

  const renderQuestionBody = () => {
    switch (qType) {
      case 'image':
        return (
          <ImageQuestion
            question={question}
            value={value}
            onChange={onChange}
            disabled={isDisabled}
            showCorrectness={showCorrectness}
          />
        );

      case 'multi':
        return (
          <MultiQuestion
            question={question}
            value={value}
            onChange={onChange}
            onSubmitAnswer={onSubmitAnswer}
            disabled={isDisabled}
            showCorrectness={showCorrectness}
            isAnswered={isAnswered}
          />
        );

      case 'fill':
        return (
          <FillQuestion
            question={question}
            value={value}
            onChange={onChange}
            onSubmitAnswer={onSubmitAnswer}
            disabled={isDisabled}
            showCorrectness={showCorrectness}
          />
        );

      case 'match':
        return (
          <MatchQuestion
            question={question}
            value={value}
            onChange={onChange}
            onSubmitAnswer={onSubmitAnswer}
            disabled={isDisabled}
            showCorrectness={showCorrectness}
          />
        );

      case 'order':
        return (
          <OrderQuestion
            question={question}
            value={value}
            onChange={onChange}
            onSubmitAnswer={onSubmitAnswer}
            disabled={isDisabled}
            showCorrectness={showCorrectness}
          />
        );

      case 'terminal':
        return (
          <TerminalQuestion
            question={question}
            value={value}
            onChange={onChange}
            onSubmitAnswer={onSubmitAnswer}
            disabled={isDisabled}
            showCorrectness={showCorrectness}
          />
        );

      case 'choice':
      default:
        return (
          <ChoiceQuestion
            question={question}
            value={value}
            onChange={onChange}
            disabled={isDisabled}
            showCorrectness={showCorrectness}
          />
        );
    }
  };

  return (
    <QuestionShell
      question={question}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      isAnswered={isAnswered}
      isCorrect={isCorrect}
      showFeedback={showFeedback}
      accentColor={accentColor}
    >
      {renderQuestionBody()}
    </QuestionShell>
  );
};

export default QuestionRenderer;
