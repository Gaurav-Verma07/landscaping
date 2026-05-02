// "use client"

// import { CommunicationStoreProvider } from "@/lib/stores"
// import { CustomerStoreProvider } from "@/lib/stores"
// import { ProjectStoreProvider } from "@/lib/stores"
// import { BillingStoreProvider } from "@/lib/stores"
// import { AppointmentStoreProvider } from "@/lib/stores"
// import { LaborStoreProvider } from "@/lib/stores"
// import { DocumentStoreProvider } from "@/lib/stores"

// export function CustomerStoreWrapper({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <CustomerStoreProvider>
//       <ProjectStoreProvider>
//         <BillingStoreProvider>
//           <AppointmentStoreProvider>
//             <LaborStoreProvider>
//               <DocumentStoreProvider>
//                 <CommunicationStoreProvider>{children}</CommunicationStoreProvider>
//               </DocumentStoreProvider>
//             </LaborStoreProvider>
//           </AppointmentStoreProvider>
//         </BillingStoreProvider>
//       </ProjectStoreProvider>
//     </CustomerStoreProvider>
//   )
// }
