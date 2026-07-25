Form primitives. Input: serif text, 2px border that inks up on focus. Checkbox: hand-built square, unicode check. ProgressBar: solid fill with a dithered leading edge.

```jsx
<Input label="Search items" placeholder="Search items…" />
<Checkbox label="Mark complete" checked onChange={fn} />
<ProgressBar value={70} tone="gold" />
```
