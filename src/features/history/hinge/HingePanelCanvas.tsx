import { Canvas } from '@react-three/fiber';
import { Component } from 'react';
import { HingeScene } from './HingeScene';
import type { HingePanelCanvasProps } from './types';

// El único picking de la escena lo activa watchPanelHover al detectar un puntero fino.
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
        gl={{ alpha: true }} orthographic flat events={events}>
        <HingeScene {...this.props} onUnavailable={this.fail} />
      </Canvas>
    );
  }
}

export default function HingePanelCanvas(props: HingePanelCanvasProps) {
  return <CanvasBoundary {...props} />;
}
