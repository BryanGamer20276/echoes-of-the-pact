export async function loadCharacter(name) {
    const module = await import(`../characters/${name}/index.js`);
    return module.default;
}
