export type RelationshipType =
	| 'association'
	| 'inheritance'
	| 'implementation'
	| 'aggregation'
	| 'composition';

export type AnchorPoint = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface RelationshipAnchors {
	source: AnchorPoint;
	target: AnchorPoint;
}

export interface Relationship {
	id: string;
	type: RelationshipType;
	sourceId: string;
	targetId: string;
	sourceMultiplicity?: string;
	targetMultiplicity?: string;
	label?: string;
	anchors: RelationshipAnchors;
}
