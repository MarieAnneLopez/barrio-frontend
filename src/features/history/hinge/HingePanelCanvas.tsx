import { Canvas } from '@react-three/fiber';
import { Component } from 'react';
import { HINGE_CAMERA } from './hingeMath';
import { HingeScene } from './HingeScene';
import type { HingePanelCanvasProps } from './types';

// Capa solo visual (pointer-events: none): sin picking, los clics llegan a los enlaces de la tarjeta.
const events = () => ({ enabled: false, priority: 1 });

class CanvasBoundary extends Component<HingePanelCanvasProps> {
  state = { failed: false };
  private reported = false;

  static getDerivedStateFromError() { return { failed: true }; }

  private fail = () => {
    if (this.reported) return;
    this.reported = true;
    this.setState({ failed: true });
    this.props.onUnavailable();
  };

  componentDidCatch() { this.fail(); }

  render() {
    if (this.state.failed) return null;
    const { className } = this.props;
    return (
      <Canvas aria-hidden="true" className={className} frameloop="demand" dpr={[1, 1.75]}
        gl={{ alpha: true }} camera={HINGE_CAMERA} flat events={events} resize={{ scroll: false }}>
        <HingeScene {...this.props} onUnavailable={this.fail} />
      </Canvas>
    );
  }
}

export default function HingePanelCanvas(props: HingePanelCanvasProps) {
  return <CanvasBoundary {...props} />;
}
