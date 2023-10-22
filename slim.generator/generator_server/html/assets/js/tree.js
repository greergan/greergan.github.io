import * as slim from "./slim_modules.js";
export class Tree {
    #id;
    #parent_id;
    #parent_onclick;
    #anchor;
    #label;
    #classes;
    #display;
    #tree;
    #children;
    #childTrees;
    constructor(properties={}) {
        if('anchor' in properties && 'label' in properties && 'classes' in properties && 'id' in properties) {
            this.#anchor = properties.anchor;
            this.#id = properties.id;
            this.#label = properties.label;
            this.#parent_id = `${properties.id}-parent`;
            this.#display = false;
            if('display' in properties) {
                typeof properties.display === 'boolean'
                    ? this.#display = properties.display
                    : console.error('Tree.constructor if present, display must be a boolean value');
            }
            if('children' in properties) {
                Array.isArray(properties.children)
                    ? this.#children = properties.children
                    : console.error('Tree.constructor children must be an array');
            }
            if('parent_onclick' in properties) {
                typeof properties.parent_onclick === 'function'
                    ? this.#parent_onclick = properties.parent_onclick
                    : console.error('Tree.constructor parent_onclick must be a function)');
            }
            if('tree' in properties.classes && 'folded' in properties.classes && 'expanded' in properties.classes) {
                this.#classes = properties.classes;
                this.#configure();
                if(!this.#childTrees) {
                    this.#childTrees = new Map();
                }
                if(this.#childTrees.size == 0) {
                    this.#childTrees.set(this.#id, this);
                }
            }
            else {
                throw new Error('Tree classes expects tree, folded and expanded classes');
            }
        }
        else {
            console.log(properties)
            throw new Error('Tree expects id, label, anchor and classes object');
        }
    }
    get id() {
        return this.#id;
    }
    #toggleState = (event) => {
        //console.log('Tree::#toggleState', event.target.id, event.target.localName);
        if(event.target.localName === 'span') {
            const element = document.getElementById(event.target.parentElement.id);
            element.classList.toggle(this.#classes.expanded);
            for(const childElement of element.children) {
                if(childElement.localName !== 'span') {
                    if(childElement.localName === 'div' || childElement.localName === 'table') {
                        childElement.style.display = childElement.style.display === 'none' ? '' : 'none';
                    }
                    else if(childElement.localName === 'ul') {
                        for(const child of childElement.children) {
                            child.style.display = child.style.display === 'none' ? '' : 'none';
                        }
                    }
                }
            }
        }
        //slim.utilities.stopPropagation(event);
    };
    #configure() {
        (async (my) => {
            const span_id = `${my.#id}-span`;
            const  style = my.#display ? '' : 'display:none';
            my.#tree = await slim.ui.html.create_ul({
                id:my.#parent_id,
                classes:[my.#classes.tree],
                append_objects:[
                    await slim.ui.html.create_li({id:my.#id,classes:[my.#classes.folded],style:style,
                        append_objects: [
                            await slim.ui.html.create_span({id:span_id,text:my.#label})
                        ]
                    })
                ]
            })
            document.getElementById(my.#anchor).appendChild(my.#tree);
            slim.utilities.addEventListener(span_id, 'click', my.#toggleState);
            if(my.#parent_onclick && typeof my.#parent_onclick === 'function') {
                slim.utilities.addEventListener(my.#parent_id, 'click', my.#parent_onclick);
            }
            if(this.#children && Array.isArray(this.#children) && this.#children.length > 0) {
                const element = document.getElementById(my.#id);
                const child_id_base = `${my.#id}-text`;
                let index = 0;
                for await (const child of this.#children) {
                    if('type' in child && child.type === 'element') {
                        if('element' in child) {
                            element.appendChild(child.element);
                        }
                        else {
                            console.error('Tree::configure when type of child is element an Javascript created dom node is expected');
                        }
                    }
                    else {
                        const child_id = `${child_id_base}-${index}`;
                        let classes = [];
                        if('classes' in child) {
                            if(Array.isArray(child.classes)) {
                                classes = child.classes;
                            }
                            else {
                                console.error('Tree::configure classes in child expected to be an array');
                            }
                        }
                        classes.push(this.#classes.child_text);
                        element.appendChild(
                            await slim.ui.html.create_div({id:`${child_id}`,text:child.text,style:'display:none',classes:classes})
                        );
                    }
                    index++;
                }
            }
        }
        )(this);
    }
    async insertChildTree(properties) {
        if('id' in properties && 'parent' in properties && 'label' in properties) {
            if(this.#childTrees.has(properties.parent)) {
                const parent = this.#childTrees.get(properties.parent);
                properties.anchor = parent.#id;
                properties.classes = parent.#classes;
                this.#childTrees.set(properties.id, new Tree(properties))
            }
        }
        else {
            throw new Error('Tree.insertChild expects a parent, id and label properties');
        }
    }
}