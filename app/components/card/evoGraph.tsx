import React from 'react';
import { observer } from 'mobx-react';
import { Store } from 'app/store';
import css from 'styles/components/card/evoGraph.scss';
import { CardIcon } from 'app/components/cardIcon';
import { max } from 'lodash';

export interface EvoGraphProps {
  id: number;
}

interface EvoGraphCard {
  id: number;
  baseId: number;
  uevo: boolean;
  materials: number[];
}

enum EvoType {
  Normal,
  Ultimate,
  Reincarnation,
  Pixel,
  Assist
}
namespace EvoType {
  export function toString(type: EvoType) {
    switch (type) {
      case EvoType.Normal: return '';
      case EvoType.Ultimate: return 'ult. evo.';
      case EvoType.Reincarnation: return 'reinc. evo.';
      case EvoType.Pixel: return 'pixel evo.';
      case EvoType.Assist: return 'assist evo.';
    }
  }
}

interface EvoGraphNode {
  id: number;
  edges: EvoGraphEdge[];
  maxBreadth: number;
}

interface EvoGraphEdge {
  target: EvoGraphNode;
  type: EvoType;
  materials: number[];
}

@observer
export class EvoGraph<T> extends React.Component<EvoGraphProps> {
  private readonly store = Store.instance;

  private computeGraph(rootId: number) {
    const cards = this.store.gameDB.cards
      .filter(card => card.id < 100000 && card.evoRootId === rootId)
      .map((card): EvoGraphCard => ({
        id: card.id,
        baseId: card.evoBaseId,
        uevo: card.isUltEvo,
        materials: card.evoMaterials,
      }));

    function evoType(from: EvoGraphCard, to: EvoGraphCard): EvoType {
      if (to.uevo) {
        if (to.materials.includes(3826)) return EvoType.Pixel;
        return EvoType.Ultimate;
      } else {
        if (to.materials.includes(3911)) return EvoType.Assist;
        if (from.uevo) return EvoType.Reincarnation;
        return EvoType.Normal;
      }
    }

    function computeNode(card: EvoGraphCard): EvoGraphNode {
      const edges = cards
        .filter(to => to.baseId === card.id)
        .map((to): EvoGraphEdge => ({
          target: computeNode(to),
          type: evoType(card, to),
          materials: to.materials
        }));
      const maxBreadth = Math.max(edges.length, max(edges.map(edge => edge.target.maxBreadth))) || 1;

      return { id: card.id, edges, maxBreadth };
    }

    return computeNode(cards.find(card => card.id === rootId));
  }

  render() {
    const id = this.props.id;
    const rootId = this.store.gameDB.cards.find(card => card.id === id).evoRootId;
    const node = this.computeGraph(rootId);
    return renderNode(node);

    function renderNode(node: EvoGraphNode): JSX.Element {
      return <div className={css.node}>
        <div className={css.card}>
          <CardIcon id={node.id} className={node.id === id ? css.active : ''} />
        </div>
        <div className={css.children}>{
          node.edges.map(edge => {
            return <div className={css.child} key={edge.target.id} style={{flex: edge.target.maxBreadth}}>
              <span className={css.evoType}>{EvoType.toString(edge.type)}</span>
              <div className={css.materials}>{
                edge.materials.filter(Boolean).map((id, i) => <CardIcon id={id} key={i} scale={0.4} />)
              }</div>
              {renderNode(edge.target)}
            </div>;
          })
        }</div>
      </div>;
    }
  }
}