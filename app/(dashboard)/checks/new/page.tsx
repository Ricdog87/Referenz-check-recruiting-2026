import { Suspense } from 'react'
import { NewCheckForm } from './NewCheckForm'

export default function NewCheckPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      }
    >
      <NewCheckForm />
    </Suspense>
  )
}
