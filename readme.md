A very minimalist library to help create and update dom using nothing more than data structure.

You provide a data structure that represents the DOM layout. You can use the helper functions to create parts (or all) of the structure, or make your own functions.

Invoke `Dyna.create` with the structure as the parameter to have it generate the DOM tree and create the appropriate getters/setters in the structure. If the second prameter to Dyna.create is provided, the newly generated DOM tree will automatically attach to the provided DOM node.

Subsequent changes to primitive values in the structure will dynamically update the values in the DOM (primitive values like strings).

Structural changes (adding/removing elements from the structure or arrays) you simply call `Dyna.create` or `Dyna.update` to have it update the DOM to match the new structure. For example: You can push/pop into the children array.

[See it working](https://e4.github.io/Dyna/dynaexample.html)