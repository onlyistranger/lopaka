import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerModifiers, TLayerState, TModifierType} from './abstract.layer';

type TCircleState = TLayerState & {
    p: number[]; // position
    r: number; // radius
};

export class CircleLayer extends AbstractLayer {
    protected type: ELayerType = 'circle';
    protected state: TCircleState;
    public radius: number = 1;
    public position: Point = new Point();
    // public size: Point = new Point();

    protected editState: {
        firstPoint: Point;
        position: Point;
        radius: number;
    } = null;

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        radius: {
            getValue: () => this.radius,
            setValue: (v: number) => {
                this.radius = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        }
    };

    constructor(private fill: boolean = false) {
        super();
    }

    startEdit(mode: EditMode, point: Point) {
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.radius = 1;
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            radius: this.radius
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                // todo
                break;
            case EditMode.CREATING:
                const radius = Math.max(
                    Math.max(...point.clone().subtract(firstPoint).abs().divide(2).round().xy) - 2,
                    1
                );
                this.radius = radius;
                if (originalEvent.altKey) {
                    this.position = firstPoint.clone().subtract(radius);
                } else {
                    const signs = point.clone().subtract(firstPoint).xy.map(Math.sign);
                    this.position = firstPoint.min(firstPoint.clone().add(new Point(radius * 2 + 1).multiply(signs)));
                }
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.editState = null;
        this.saveState();
        this.history.push(this.state);
    }

    draw() {
        const {dc, radius, position} = this;
        const center = position.clone().add(radius);
        dc.clear().pixelateCircle(center, radius, this.fill);
    }

    saveState() {
        const state: TCircleState = {
            p: this.position.xy,
            r: this.radius,
            n: this.name,
            i: this.index,
            g: this.group,
            t: this.type
        };
        this.state = state;
    }

    loadState(state: TCircleState) {
        this.position = new Point(state.p);
        this.radius = state.r;
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.updateBounds();
    }

    updateBounds() {
        this.bounds = new Rect(this.position, new Point(this.radius * 2)).add(0, 0, 1, 1);
    }
}
