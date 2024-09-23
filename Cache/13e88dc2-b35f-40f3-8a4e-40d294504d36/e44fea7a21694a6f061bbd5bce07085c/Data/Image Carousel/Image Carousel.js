// ImageCarousel.js
// Version 15.0
// Provides a dynamic carousel UI for the selection of one image between many
// Event - OnAwake
// 
// When selection is made the event 'onSelectionUpdate' will be triggerd
// 'callbackFuncName' in the script 'callbackScript' will be called as well if defined in the UI
//
/**
*
* === EVENTS ===
*
* onSelectionUpdate(index, texture)
*     'i' is the index of the item in the carousel
*     'tex' is the texture of the icon that was selected
*
*      * Registering for the event from another script:
*        script.carouselCC.onSelectionUpdate.add(function(index, texture) {...});
*
*
* === API ===
* @api
*
* size(): int
*      Returns the number of items in the carousel
*
* setSelected(int index, bool animate): void
*      Select item at index, animate to position if animate === true
*
* getSelected(): int
*      Returns the currently selected item index, or -1 if the carousel is empty
*
* getCentered(): int
*      Returns item index closest to center (works while dragging/animating too)
*
* add(Texture image): int
*      Add an item to the end of the carousel with image
*      Returns the new image index
*
* remove(int index): bool
*      Remove image at index, returns false if index is out of bounds
*
* setImage(int index, Texture image): bool
*      Set image at index, returns false if index is out of bounds
*
* getImage(int index): Texture
*      Returns the image texture for index, or null if index is out of bounds
*
* getSelectedImage(): Texture
*      Returns the currently selected image texture, or null is the carousel is empty
*
* setLocked(int index, bool locked): void
*      Show/Hide locked badge on the icon
*
* getLocked(int index): bool
*      Get locked state for icon index
*
* setData(int index, Object data) : void
*      Set private data associated with this icon
*
* getData(int index): Object
*      Get private data associated with this icon
*
* enableInteraction(): void
*      Enable UI
*
* disableInteraction(): void
*      Disable UI
*
* show(): void
*      Show carousel
*
* hide(): void
*      Hide carousel
*
* isVisible(): bool
*      Returns visibility
*
*/

//@input Asset.Texture[] images

//@ui {"widget":"separator"}

//@ui {"widget":"group_start", "label":"On Item Set Callbacks"}
//@input int callbackType = 0 {"widget":"combobox", "values":[{"label":"None", "value":0}, {"label":"Behavior Script", "value": 1}, {"label":"Behavior Custom Trigger", "value":2}, {"label":"Custom Function", "value":3}]}

//@ui {"widget":"group_start", "label":"On Item Trigger Behaviors", "showIf":"callbackType", "showIfValue":1}
//@input Component.ScriptComponent[] behaviors 
//@ui {"widget":"group_end"}

//@ui {"widget":"group_start", "label":"On Item Custom Triggers", "showIf":"callbackType", "showIfValue":2}
//@input string[] customTrigger
//@ui {"widget":"group_end"}

//@ui {"widget":"group_start", "label":"On Item Set Call", "hint" : "Will call your_script.your_func_name(index, image_texture)", "showIf":"callbackType", "showIfValue":3}
//@input Component.ScriptComponent callbackScript {"label" : "Script"}
//@input string callbackFuncName {"label" : "Function Name", "hint" : "Will call your_script.your_func_name(index, image_texture)"}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}

//@ui {"widget":"group_start", "label":"Look"}
//@input int visibleItems = 3 { "widget": "combobox", "values": [{"label": "3", "value": 3}, {"label": "5", "value": 5}]}
//@input float itemSize = 1.9 {"widget": "slider", "min": 0.2, "max": 5.0, "step": 0.01}
//@input float carouselRadius = 1.9 {"widget": "slider", "min": 0.2, "max": 6.0, "step": 0.01}
//@input float opacity = 1 {"widget": "slider", "min": 0.0, "max": 1.0, "step": 0.01}
//@input vec4 backgroundColor = {0,0,0,0} {"widget": "color"}
//@ui {"widget":"group_end"}

//@input bool advanced

//@ui {"widget":"group_start", "label":"Look", "showIf": "advanced"}
//@input float ringMargin = 0.2 {"widget": "slider", "min": 0, "max": 2.0, "step": 0.01, "showIf": "advanced"}
//@input float itemRotation = 0.0 {"widget": "slider", "min": 0, "max": 360, "step": 1, "showIf": "advanced"}
//@input Asset.Material itemMaterial {"showIf": "advanced"}
//@input Asset.Material ringMaterial {"showIf": "advanced"}
//@input Asset.Material bgMaterial {"showIf": "advanced"}
//@input int baseRenderOrder = 0 {"label": "Render Order", "showIf": "advanced"}
//@input Asset.Texture lockedTexture { "showIf" : "advanced" }
//@ui {"widget":"group_end", "showIf": "advanced"}

//@ui {"widget":"group_start", "label":"Feel", "showIf": "advanced"}
//@input float touchSensitivity = 2 {"showIf": "advanced", "widget": "slider", "min": 1, "max": 14, "step": 0.25}
//@input float magnetForce = 0.4 {"showIf": "advanced", "widget": "slider", "min": 0.3, "max": 0.9, "step": 0.1}
//@input float inertiaForce = 0.15 {"showIf": "advanced", "widget": "slider", "min": 0, "max": 1, "step": 0.1}
//@input float delayCallback = 0 {"showIf": "advanced"}
//@ui {"widget":"group_end"}

// Destruction Helper
const DestructionHelper = require("./DestructionHelper_100");
const manager = new DestructionHelper(script);
// Event Module
const eventModule = require("./EventModule_101");
script.onSelectionUpdate = new eventModule.EventWrapper();

const NUMITEMS = (script.visibleItems===3)?5:11;
const SIZE_POW = (script.visibleItems===3)?0.4:1;

var items = [];
var ring = {
    st: null,
    img: null,
    mat: null,
    open: 0,
    openTarget: 0
};
var allowInteraction = true;
var touching = false;
var lastTouch = {
    pos: new vec2(0, 0),
    time: 0,
    speed: 0
};
var currentIndex = -1;
var currentAng = 0, targetAng = 0, autoTargetAng = 0;
var autoMode = false;
var forwardIndex, backwardIndex;
var lastIndexSet = -1;
var carouselUI, carouselUIArea;
var ringSo;
var carouselVisibility=1, carouselTargetVisibility = 1;
var content = [];

/******************************************************************************/
/* Image Carousel API
/******************************************************************************/

script.size = function() {
    return content.length;
};

script.setSelected = function(i, animate) {
    if (i<0 || i>=content.length) {
        print("Warning, cannot select index "+i+" (out of bounds)");
        return;
    }

    if (animate) {
        const imageIndex = items[currentIndex].contentIndex;
        var moveIndex = i-imageIndex;
        if (Math.abs(moveIndex) > 0.5*content.length) {
            if (moveIndex>0) {
                moveIndex = -1*(content.length - moveIndex);
            } else {
                moveIndex = content.length + moveIndex;
            }
        }
        if (moveIndex === 0) {
            return;
        }

        autoTargetAng = targetAng-moveIndex*(2*Math.PI/NUMITEMS);
        ring.openTarget = 1;
        autoMode = true;
        touching = false;
    } else {
        assignImages(currentIndex, i);
        notifySelection();
    }
};

script.getSelected = function() {
    if (currentIndex < 0 || currentIndex >= items.length) {
        return -1;
    }

    return items[currentIndex].contentIndex;
};

script.getCentered = function() {
    const itemIndex = getClosestItemIndex();
    if (itemIndex >= items.length) {
        return -1;
    }

    const contentIndex = items[itemIndex].contentIndex;
    if (contentIndex >= content.length) {
        return -1;
    }

    return contentIndex;
};

script.add = function(tex) {
    const notify = content.length==0;
    content.push({ iconTex: tex, locked: false, badgeTex: undefined });
    if (!(currentIndex>-1)) {
        assignImages(0,0);
        currentIndex = 0;
    } else {
        assignImages(currentIndex, items[currentIndex].contentIndex);
    }
    adjustUI();
    if (notify) {
        notifySelection();
    }
    
    return content.length-1;
};

script.remove = function(i) {
    if (i<0 || i>=content.length) {
        print("Warning, cannot remove index "+i+" (out of bounds)");
        return false;
    }

    const oldSelectedContent = items[currentIndex].content;
    var oldSelectedImageIndex = items[currentIndex].contentIndex;
    if (i<oldSelectedImageIndex) {
        oldSelectedImageIndex--;
    }
    content.splice(i, 1);
    assignImages(currentIndex, oldSelectedImageIndex);
    adjustUI();
    if (items[currentIndex].content != oldSelectedContent) {
        notifySelection();
    }
    return true;
};

script.setImage = function(i, tex) {
    if (i<0 || i>=content.length) {
        print("Warning, no item at index "+i+" (out of bounds)");
        return false;
    }
    
    content[i].iconTex = tex;
    if (!(currentIndex>-1)) {
        assignImages(0,0);
        currentIndex = 0;
    } else {
        assignImages(currentIndex, items[currentIndex].contentIndex);
    }
    
    if (i === items[currentIndex].contentIndex) {
        notifySelection();
    }
};

script.getImage = function(i) {
    if (i<0 || i>=content.length) {
        print("Warning, no content at index "+i+" (out of bounds)");
        return null;
    }

    return content[i].iconTex;
};

script.getSelectedImage = function() {
    if (currentIndex < 0 || currentIndex >= items.length) {
        return null;
    }

    return items[currentIndex].content;
};

script.setLocked = function(i, locked) {
    if (i<0 || i>=content.length) {
        print("Warning, no content at index "+i+" (out of bounds)");
        return;
    }
    
    if (locked) {
        content[i].locked = true;
        content[i].badgeTex = script.lockedTexture;
    } else {
        content[i].locked = false;
        content[i].badgeTex = null;
    }
    assignImages(currentIndex, items[currentIndex].contentIndex);
};

script.getLocked = function(i) {
    if (i<0 || i>=content.length) {
        print("Warning, no content at index "+i+" (out of bounds)");
        return false;
    }

    return content[i] && content[i].locked;
};

script.setData = function(i, data) {
    if (i<0 || i>=content.length) {
        print("Warning, no content at index "+i+" (out of bounds)");
        return false;
    }
    
    content[i].data = data;
};

script.getData = function(i) {
    if (i<0 || i>=content.length) {
        print("Warning, no content at index "+i+" (out of bounds)");
        return null;
    }
    
    return content[i].data;
};

script.enableInteraction = function() {
    allowInteraction = true;
    adjustUI();
};

script.disableInteraction = function() {
    allowInteraction = false;
    adjustUI();
    if (touching) {
        touching = false;
        snapToClosest();
    }
};

script.show = function() {
    carouselTargetVisibility = 1;
    adjustUI();
};

script.hide = function() {
    carouselTargetVisibility = 0;
    adjustUI();
};

script.isVisible = function() {
    return (carouselTargetVisibility>0);
};

/******************************************************************************/
/* Internal functions
/******************************************************************************/

function init() {
    // Create items root and items scene objects
    const ccSo = script.getSceneObject();

    // Check for a ScreenTransform
    const st = ccSo.getComponent("Component.ScreenTransform");
    if (!st) {
        print("Error, ImageCarousel needs a ScreenTransform");
        return false;
    }

    // Check for screen hierarchy
    if (!st.isInScreenHierarchy()) {
        print("Error, ImageCarousel not in screen hierarchy");
        return false;
    }
    
    const root = createSceneObjects(ccSo);
    initInteraction(root, st);

    // add initial images to content
    for (var i=0; i<script.images.length; i++) {
        content.push({iconTex: script.images[i], locked: false, badgeTex: undefined });
    }
    if (content.length>0) {
        setCenteredItem(0);
        assignImages(0,0);
    }
    adjustUI();

    // Add CC enable/disable events
    script.createEvent("OnEnableEvent").bind(function() {
        root.enabled = true;
    });
    script.createEvent("OnDisableEvent").bind(function() {
        root.enabled = false;
    });
    return true;
}

function createSceneObjects(ccSo) {
    // Create carousel root SceneObject
    const so = manager.createSceneObject(ccSo);
    so.name = "ImageCarouselRoot";
    so.setRenderLayer(ccSo.getRenderLayer());
    so.createComponent("Component.ScreenTransform");

    // Create selection ring
    const ringParent = global.scene.createSceneObject("SelectionRingParent");
    ringParent.setParent(so);
    ringSo = global.scene.createSceneObject("SelectionRing");
    ringSo.setParent(ringParent);
    ringSo.setRenderLayer(ccSo.getRenderLayer());
    ring.st = ringSo.createComponent("Component.ScreenTransform");
    ring.mat = script.ringMaterial.clone();
    ring.img = ringSo.createComponent("Component.Image");
    ring.img.clearMaterials();
    ring.img.addMaterial(ring.mat);
    ring.img.stretchMode = StretchMode.Fit;
    ring.img.setRenderOrder(script.baseRenderOrder+1);

    // Create items root
    const itemsRootSo = global.scene.createSceneObject("Items");
    itemsRootSo.setParent(so);
    itemsRootSo.setRenderLayer(ccSo.getRenderLayer());

    // Setup carousel items
    for (var i = 0; i < NUMITEMS; i++) {
        const c = global.scene.createSceneObject("Item" + i);
        c.setParent(itemsRootSo);
        c.setRenderLayer(ccSo.getRenderLayer());
        const st = c.createComponent("Component.ScreenTransform");
        st.rotation = quat.fromEulerAngles(0, 0, -script.itemRotation*MathUtils.DegToRad);
        const img = c.createComponent("Component.Image");
        img.clearMaterials();
        img.addMaterial(script.itemMaterial.clone());
        const inter = c.createComponent("Component.InteractionComponent");
        const interScript = c.createComponent("Component.ScriptComponent");
        interScript.createEvent("TapEvent").bind(tapOnItemFunction(i));
        items.push({
            so: c,
            st: st,
            img: img,
            ang: 0,
            prevAng: 0,
            ui: inter
        });
    }
    
    return so;
}

function initInteraction(root, st) {
    // Setup carousel interaction
    carouselUIArea = root.createComponent("Component.Image");
    carouselUIArea.addMaterial(script.bgMaterial.clone());
    carouselUIArea.mainPass.baseColor = script.backgroundColor;
    carouselUIArea.setRenderOrder(script.baseRenderOrder);
    root.createComponent("Component.InteractionComponent");
    carouselUI = root.createComponent("Component.ScriptComponent");
    carouselUI.createEvent("TouchStartEvent").bind(function(args) {
        if (autoMode) {
            return;
        }

        const pos = st.screenPointToLocalPoint(args.getTouchPosition());
        touching = true;
        lastTouch.pos.x = pos.x;
        lastTouch.pos.y = pos.y;
        lastTouch.time = getTime();
        lastTouch.speed = 0;
        ring.openTarget = 1;
    });
    carouselUI.createEvent("TouchMoveEvent").bind(function(args) {
        if (!touching) {
            return;
        }

        const pos = st.screenPointToLocalPoint(args.getTouchPosition());
        const offt = pos.x - lastTouch.pos.x;
        targetAng += script.touchSensitivity * offt;
        lastTouch.pos.x = pos.x;
        lastTouch.pos.y = pos.y;
        const t = getTime();
        if (t - lastTouch.time > 0) {
            const fs = offt * (1 / (t - lastTouch.time));
            lastTouch.speed += 0.6 * (fs - lastTouch.speed);
        }
        lastTouch.time = t;
        updateItems(1);
    });
    carouselUI.createEvent("TouchEndEvent").bind(function(args) {
        if (!touching) {
            return;
        }
        touching = false;

        if (items.length < 1) {
            return;
        }

        targetAng += script.inertiaForce * lastTouch.speed;
        snapToClosest();
    });    
}

function start() {
    updateItems(1, true);
}

function update() {
    if (!touching) {
        updateItems(script.magnetForce, false);
    }
}

function adjustUI() {
    // Enable UI if: interaction allowed, is visible, and more than one item
    const enUI = (allowInteraction && script.isVisible() && content.length>1);
    carouselUI.enabled = enUI;
    // If only one item exists hide all others
    items.forEach(function(item) {
        // Enable/Disable tap on item
        item.ui.enabled = enUI;
        item.so.enabled = content.length>1;
    });
    if (content.length==1) {
        items[currentIndex].so.enabled = true;
    }
    // Show ring when there is one or more items
    ringSo.enabled = content.length>0;
}

function tapOnItemFunction(i) {
    return function(args) {
        setCenteredItem(i);
    };
}

// Assign images to carousel items
function assignImages(centerItemIndex, centerImageIndex) {
    if (content.length == 0) {
        items.forEach(function(item) {
            item.img.mainPass.baseTex = null;
            item.contentIndex = -1;
            item.content = null;
        });
        return;
    }

    forwardIndex = centerImageIndex-1;
    backwardIndex = (content.length+centerImageIndex)%content.length;
    const half = 0.5 * items.length;
    for (var i = centerItemIndex; i < centerItemIndex+half; i++) {
        forwardIndex = (forwardIndex + 1) % content.length;
        items[i%items.length].img.mainPass.baseTex = content[forwardIndex].iconTex;
        const showBadge = !!(content[forwardIndex].badgeTex);
        items[i%items.length].img.mainPass.showBadge = showBadge;
        if (showBadge) {
            items[i%items.length].img.mainPass.badgeTex = content[forwardIndex].badgeTex;
        }
        items[i%items.length].contentIndex = forwardIndex;
        items[i%items.length].content = content[forwardIndex].iconTex;
    }
    for (i = items.length - 1 + centerItemIndex; i > centerItemIndex+half; i--) {
        backwardIndex--;
        if (backwardIndex < 0) {
            backwardIndex = content.length - 1;
        }
        items[i%items.length].img.mainPass.baseTex = content[backwardIndex].iconTex;
        const showBadge = !!(content[backwardIndex].badgeTex);
        items[i%items.length].img.mainPass.showBadge = showBadge;
        if (showBadge) {
            items[i%items.length].img.mainPass.badgeTex = content[backwardIndex].badgeTex;
        }
        items[i%items.length].contentIndex = backwardIndex;
        items[i%items.length].content = content[backwardIndex].iconTex;
    }
}

function updateItems(magnetForce, force) {
    if (items.length < 1) {
        return;
    }

    const angStep = 2 * Math.PI / items.length;

    // Update carousel opacity
    const visibilityOffset = carouselTargetVisibility-carouselVisibility;
    if (Math.abs(visibilityOffset) < 0.001) {
        carouselVisibility = carouselTargetVisibility;
    } else {
        carouselVisibility += 0.2*visibilityOffset;
    }
    const alpha = (script.opacity*carouselVisibility);

    // update BG alpha
    var bgColor = new vec4(script.backgroundColor.r, script.backgroundColor.g, script.backgroundColor.b, script.backgroundColor.a);
    bgColor.a *= alpha;
    carouselUIArea.mainPass.baseColor = bgColor;

    // Animate selection ring
    ring.open += 0.6 * (ring.openTarget - ring.open);
    const ringScale = 1 + 0.4 * ring.open;
    const ringAlpha = alpha - 0.4 * ring.open;
    ring.st.anchors.setSize(new vec2(ringScale * (script.itemSize + script.ringMargin), ringScale * (script.itemSize + script.ringMargin)));
    ring.mat.mainPass.alpha = ringAlpha;

    // handle auto (API) mode
    if (autoMode) {
        const autoOffset = autoTargetAng-targetAng;
        if (Math.abs(autoOffset)<0.05) {
            snapToClosest();
            autoMode = false;
        } else {
            targetAng += 0.2*autoOffset;
        }
    }

    // Calculate offset from target angle to current angle
    var offset = minusPItoPI(targetAng - currentAng);
    // Scale down ring selector if offset is close to 0
    if (!touching && Math.abs(offset) < 0.05) {
        ring.openTarget = 0;
    }

    // Stop animation if selected item is centered
    if (!force && Math.abs(offset) < 0.0001 && Math.abs(visibilityOffset) < 0.001) {
        return;
    }

    // If almost centered, center completely and call setItem function
    // Else animate into position
    if (!touching && Math.abs(offset) < 0.05) {
        currentAng = targetAng;
        if (currentIndex != lastIndexSet) {
            setDelayedAction(script.delayCallback, function() {
                notifySelection();
            });
            lastIndexSet = currentIndex;
        }
    } else {
        currentAng += magnetForce * (offset);
    }

    // Set items position, size, and render order
    for (var i = 0; i < items.length; i++) {
        const item = items[i];
        const st = item.st;
        item.prevAng = item.ang;
        item.ang = zeroTo2PI(currentAng + i * angStep);
        const p = quat.angleAxis(item.ang, new vec3(0, 1, 0)).multiplyVec3(new vec3(0, 0, script.carouselRadius));
        const normZ = p.z / script.carouselRadius;
        const size = normZ < 0 ? 0 : Math.pow(normZ, SIZE_POW);
        st.anchors.setCenter(new vec2(p.x, 0));
        st.anchors.setSize(new vec2(script.itemSize * size, script.itemSize * size));
        item.img.setRenderOrder(script.baseRenderOrder + NUMITEMS * size);
        item.img.mainPass.alpha = map(normZ, 0, 0.1, 0, alpha, true);

        // Replace images
        const pbackdist = item.prevAng - Math.PI;
        const backdist = item.ang - Math.PI;
        if (Math.abs(pbackdist) < 0.5 * Math.PI && Math.abs(backdist) < 0.5 * Math.PI) {
            if (pbackdist < 0 && backdist > 0) {
                // rotate indices back
                rotateIndices(-1);
                item.contentIndex = backwardIndex;
                item.content = content[item.contentIndex].iconTex;
                item.img.mainPass.baseTex = item.content;
                const showBadge = !!content[item.contentIndex].badgeTex;
                item.img.mainPass.showBadge = showBadge;
                if (showBadge) {
                    item.img.mainPass.badgeTex = content[item.contentIndex].badgeTex;
                }
            } else if (pbackdist > 0 && backdist < 0) {
                // rotate indices forward
                rotateIndices(1);
                item.contentIndex = forwardIndex;
                item.content = content[item.contentIndex].iconTex;
                item.img.mainPass.baseTex = item.content;
                const showBadge = !!content[item.contentIndex].badgeTex;
                item.img.mainPass.showBadge = showBadge;
                if (showBadge) {
                    item.img.mainPass.badgeTex = content[item.contentIndex].badgeTex;
                }
            }
        }
    }
}

/**
 * Triggers behaviors for a given list of behavior components.
 * 
 * @param {Object[]} behaviors - Array of behavior components to be triggered.
 */
function triggerBehaviors(behaviors) {
    if (!behaviors) {
        print("WARNING: please assign the Behavior Script Component");
        return;
    }
    
    if (behaviors && behaviors.api.trigger) {
        behaviors.api.trigger();    
    } else {
        print("WARNING: please assign the Behavior Script Component");
    }
    
}

/**
 * Sends custom triggers to the global behavior system.
 * 
 * @param {string[]} triggerNames - Array of custom trigger names to send.
 */
function customTriggers(triggerNames){
    if (!global.behaviorSystem) {
        print("The global behavior system has not been instantiated yet! Make sure a Behavior script is present somewhere!");
        return;
    }
    
    if (!triggerNames) {
        print("You are trying to send an empty string custom trigger!");
        return;
    }
    
    global.behaviorSystem.sendCustomTrigger(triggerNames);
}

/**
 * Calls a specified function within a script component, passing in index and content parameters.
 * 
 * @param {number} index - The index to pass to the callback function.
 * @param {string} content - The content to pass to the callback function.
 */
function customFunction(i, c){
    // If UI provides a script and a function calls that as well
    if (script.callbackScript && script.callbackFuncName) {
        if (script.callbackScript[script.callbackFuncName]) {
            script.callbackScript[script.callbackFuncName](i, c);
        } else {
            print("Error, cannot find function '" + script.callbackFuncName + "' in script");
        }
    }
}

/**
 * Notifies of a selection change and triggers corresponding behaviors or functions based on the callback type.
 */

function notifySelection() {
    const index = items[currentIndex].contentIndex;
    const content = items[currentIndex].content;

    // Trigger onSelectionUpdate event
    script.onSelectionUpdate.trigger(index, content);

    if (script.callbackType > 0){
        switch(script.callbackType) {
            case 1:
                triggerBehaviors(script.behaviors[index]);
                break;
            case 2:
                customTriggers(script.customTrigger[index]);
                break;
            case 3:
                customFunction(index, content);
                break;
        }
    }
}

function getClosestItemIndex() {
    var closestIndex = 0;
    var closestAng = Math.abs(minusPItoPI(-targetAng));

    // snap to closest item
    const angStep = 2 * Math.PI / items.length;
    for (var i = 1; i < items.length; i++) {
        const ang = minusPItoPI(targetAng + i * angStep);
        if (Math.abs(ang) < closestAng) {
            closestAng = Math.abs(ang);
            closestIndex = i;
        }
    }
    
    return closestIndex;
}

function snapToClosest() {
    const i = getClosestItemIndex();
    if (i>-1) {
        setCenteredItem(i);
    }
}

function rotateIndices(amount) {
    backwardIndex = (backwardIndex + amount) % content.length;
    forwardIndex = (forwardIndex + amount) % content.length;
    if (backwardIndex < 0) {
        backwardIndex += content.length;
    }
    if (forwardIndex < 0) {
        forwardIndex += content.length;
    }
}

function setCenteredItem(index) {
    if (index >= items.length) {
        return;
    }

    targetAng = -2 * Math.PI / items.length * index;
    currentIndex = index;
}

function minusPItoPI(ang) {
    while (ang > Math.PI) {
        ang -= 2 * Math.PI;
    }
    while (ang < -Math.PI) {
        ang += 2 * Math.PI;
    }
    return ang;
}

function zeroTo2PI(ang) {
    while (ang < 0) {
        ang += 2 * Math.PI;
    }
    while (ang > 2 * Math.PI) {
        ang -= 2 * Math.PI;
    }
    return ang;
}

function setDelayedAction(t, func) {
    if (t < getDeltaTime()) {
        // Time is too short, call immediately
        func();
    } else {
        const evt = script.createEvent("DelayedCallbackEvent");
        evt.bind(func);
        evt.reset(t);
    }
}

function map(input, inputMin, inputMax, outputMin, outputMax, clamp) {
    input = (input - inputMin) / (inputMax - inputMin);
    var output = input * (outputMax - outputMin) + outputMin;
    if (clamp) {
        if (outputMax < outputMin) {
            if (output < outputMax) {
                output = outputMax;
            } else if (output > outputMin) {
                output = outputMin;
            }
        } else {
            if (output > outputMax) {
                output = outputMax;
            } else if (output < outputMin) {
                output = outputMin;
            }
        }
    }
    return output;
}

// Initialize the component
if (init()) {
    // Set start event binding
    script.createEvent("OnStartEvent").bind(start);
    // Set update event binding
    script.createEvent("UpdateEvent").bind(update);    
}
