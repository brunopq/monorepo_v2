import { createRoot } from "react-dom/client"
import { Select, Button, Tooltip } from "./index"

const domNode = document.getElementById("root")
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const root = createRoot(domNode!)

const fruits = [
  "Apple",
  "Banana",
  "Cherry",
  "Date",
  "Elderberry",
  "Fig",
  "Grape",
  "Honeydew",
  "Kiwi",
  "Lemon",
  "Mango",
  "Nectarine",
  "Orange",
  "Papaya",
  "Quince",
  "Raspberry",
  "Strawberry",
  "Tangerine",
  "Ugli fruit",
  "Vanilla bean",
  "Watermelon",
  "Xigua",
  "Yellow passion fruit",
  "Zucchini",
]

root.render(
  <div className="space-y-6 p-6">
    <div className="border-2 border-dashed p-6">
      <Button>hello</Button>
    </div>

    <div className="flex gap-4 border-2 border-dashed p-2">
      <div className="space-y-4 bg-zinc-200 p-2 text-center">
        <p className="font-semibold">Small select</p>
        <Select.Root>
          <Select.Trigger size="sm" className="w-48">
            <Select.Value placeholder="Select a fruit" />
          </Select.Trigger>

          <Select.Content data-size="sm">
            {fruits.map((fruit) => (
              <Select.Item value={fruit} key={fruit}>
                {fruit}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>

      <div className="space-y-4 bg-zinc-200 p-2 text-center">
        <p className="font-semibold">Base select</p>
        <Select.Root>
          <Select.Trigger className="w-48">
            <Select.Value placeholder="Select a fruit" />
          </Select.Trigger>

          <Select.Content data-size="md">
            {fruits.map((fruit) => (
              <Select.Item value={fruit} key={fruit}>
                {fruit}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>

      <div className="space-y-4 bg-zinc-200 p-2 text-center">
        <p className="font-semibold">Large select</p>
        <Select.Root>
          <Select.Trigger size="lg" className="w-48">
            <Select.Value placeholder="Select a fruit" />
          </Select.Trigger>

          <Select.Content data-size="lg">
            {fruits.map((fruit) => (
              <Select.Item value={fruit} key={fruit}>
                {fruit}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <div className="flex gap-4 border-2 border-dashed p-2">
      <div className="space-y-4 bg-zinc-200 p-2 text-center">
        <p className="font-semibold">Tooltip</p>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button>Hover me</Button>
          </Tooltip.Trigger>
          <Tooltip.Content sideOffset={5}>This is a tooltip!</Tooltip.Content>
        </Tooltip.Root>
      </div>

      <div className="space-y-4 bg-zinc-200 p-2 text-center">
        <p className="font-semibold">Button with tooltip</p>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button>Hover me too</Button>
          </Tooltip.Trigger>
          <Tooltip.Content sideOffset={5}>Another tooltip!</Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>
  </div>,
)
