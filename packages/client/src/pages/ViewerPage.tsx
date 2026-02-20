import { useParams } from 'react-router-dom';
import { ViewerContainer } from '@/features/viewer';

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  return <ViewerContainer storybookId={id} />;
}
