import React from 'react'
type SelectProps = { value?: string, onValueChange?: (v:string)=>void, children?: React.ReactNode }
export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const items: {value:string, label:string}[] = []
  React.Children.forEach(children as any, (child: any) => {
    if (child?.type?.displayName === 'SelectContent') {
      React.Children.forEach(child.props.children, (item:any) => {
        if (item?.type?.displayName === 'SelectItem') {
          items.push({ value: String(item.props.value), label: String(item.props.children) })
        }
      })
    }
  })
  return (
    <select
      className="rounded-xl border px-3 py-2 text-sm bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
      value={value}
      onChange={e=>onValueChange && onValueChange(e.target.value)}
    >
      {items.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
    </select>
  )
}
export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({children}) => <>{children}</>
SelectTrigger.displayName = 'SelectTrigger'
export const SelectValue: React.FC = () => null
SelectValue.displayName = 'SelectValue'
export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({children}) => <>{children}</>
SelectContent.displayName = 'SelectContent'
type ItemProps = { value: string, children: React.ReactNode }
export const SelectItem: React.FC<ItemProps> = () => null
SelectItem.displayName = 'SelectItem'
export default Select
