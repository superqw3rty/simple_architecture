import type { FC } from 'react';
import { StatusMessage } from '@/components/StatusMessage';
import { ERROR_DESCRIPTION, ERROR_TITLE } from './constants';

interface ErrorComponentProps {
  onRetry: () => void;
}

export const ErrorComponent: FC<ErrorComponentProps> = ({ onRetry }) => {
  return (
    <StatusMessage
      tone="danger"
      symbol="!"
      title={ERROR_TITLE}
      description={ERROR_DESCRIPTION}
      actionLabel="Try again"
      onAction={onRetry}
    />
  );
};
