import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { CardIcon } from 'src/components/cards/CardIcon';
import { Card } from 'src/models';
import { Store } from 'src/store';
import { store, transformer } from 'src/utils';
import './CardEvolution.css';

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

  export function fromEvo(from: Card, to: Card): EvoType {
    if (to.isUltEvo) {
      if (to.evoMaterials.indexOf(3826) >= 0) return EvoType.Pixel;
      return EvoType.Ultimate;
    } else {
      if (to.evoMaterials.indexOf(3911) >= 0) return EvoType.Assist;
      if (from.isUltEvo) return EvoType.Reincarnation;
      return EvoType.Normal;
    }
  }
}

interface EvoGraphNode {
  id: number;
  edges: EvoGraphEdge[];
}

interface EvoGraphEdge {
  target: EvoGraphNode;
  type: EvoType;
  materials: number[];
}

export interface CardEvolutionProps {
  id: number;
}

@inject('store')
@observer
export class CardEvolution extends React.Component<CardEvolutionProps> {
  @store
  private readonly store: Store;

  @computed
  private get id() { return this.props.id || 0; }

  @computed
  private get card() { return this.store.gameData.getCard(this.id)!; }

  public render() {
    const card = this.card;
    if (!card) return null;

    const rootId = card.evoRootId;
    const evoGraphRoot = this.computeGraph(rootId);
    return renderNode(evoGraphRoot);

    function renderNode(node: EvoGraphNode): JSX.Element {
      return (
        <div className="CardEvolution-node">
          <div className="CardEvolution-card">
            <CardIcon
              id={node.id} link={node.id !== card.id}
              className={node.id === card.id ? 'CardEvolution-card-active' : ''}
            />
          </div>
          {
            node.edges.length > 0 && <div className="CardEvolution-children-edges">
              <div className="CardEvolution-children">{
                node.edges.map(edge => {
                  return <div className="CardEvolution-child" key={edge.target.id}>
                    <span className="CardEvolution-type">{EvoType.toString(edge.type)}</span>
                    <div className="CardEvolution-materials">{
                      edge.materials.filter(Boolean).map((id, i) => <CardIcon id={id} key={i} scale={0.4} />)
                    }</div>
                    {renderNode(edge.target)}
                  </div>;
                })
              }</div>
            </div>
          }
        </ div>
      );
    }
  }

  @transformer
  private computeGraph(rootId: number) {
    const cards = this.store.gameData.cards
      .filter(card => Card.section(card) === 0 && card.evoRootId === rootId);

    function computeNode(card: Card): EvoGraphNode {
      const edges = cards
        .filter(to => to.evoBaseId === card.id)
        .map((to): EvoGraphEdge => ({
          target: computeNode(to),
          type: EvoType.fromEvo(card, to),
          materials: to.evoMaterials
        }));

      return { id: card.id, edges };
    }

    return computeNode(cards.find(card => card.id === rootId)!);
  }
}