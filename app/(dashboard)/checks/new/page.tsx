import { Suspense } from 'react'
import { NewCheckForm } from './NewCheckForm'

export default function NewCheckPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <NewCheckForm />
    </Suspense>
  )
}
