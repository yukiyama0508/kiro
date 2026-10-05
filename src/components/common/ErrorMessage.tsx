import type { ReactNode } from 'react';
import type { FieldError } from '../../types';

interface ErrorMessageProps {
  errors: FieldError[];
}

/**
 * バリデーションエラーの一覧を表示するコンポーネント
 */
export function ErrorMessage({ errors }: ErrorMessageProps): ReactNode {
  if (errors.length === 0) return null;

  return (
    <div className="error-message" role="alert">
      <strong>入力内容を確認してください:</strong>
      <ul>
        {errors.map((err, i) => (
          <li key={`${err.field}-${i}`}>{err.message}</li>
        ))}
      </ul>
    </div>
  );
}
