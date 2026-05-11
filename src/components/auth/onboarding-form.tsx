'use client'
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type {ComponentProps}from "react"
import { cn } from "@/utils/utils";
import { Card, CardContent } from "../ui/card";
import { Building2, Check, ChevronLeft, ChevronRight, Mail, Upload, User, X } from "lucide-react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { uploadTeamLogo, upsertProfile } from "@/lib/actions/profile";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image"

type ProfilePayload = Parameters<typeof upsertProfile>[0]

type FormData = {
    // Step 1 – Personal
    full_name: string
    // Step 2 – Company
    team_name: string
    team_logo_file: File | null
    company_phone: string
    company_email: string
    company_address: string
    // Step 3 – SMTP (optional)
    smtp_host: string
    smtp_port: string
    smtp_email: string
    smtp_password: string
    smtp_from_name: string
  }

const STEPS= [
    {id:1, label:"Personal", icon:User, title:"Tell us about you", subtitle:"Let's get your basic info set up"},
    {id:2, label:"Company", icon:Building2, title:"Your company details", subtitle:"This appears on invoices and client docs."},
    {id:3, label:"Email", icon: Mail, title:"Email configuration", subtitle:"Optional - used for sending emails from your own address"}
]

export function OnboardingForm({className, ...props}: ComponentProps<"div">){
    const router= useRouter()
    const [step, setStep]= useState(1)
    const [isPending, startTransition]= useTransition()
    const [error, setError]= useState<string | null>(null)
    const [logoPreview, setLogoPreview]= useState<string | null>(null)
    const fileInputRef= useRef<HTMLInputElement>(null)

    const [form, setForm]= useState<FormData>({
        full_name:"",
        team_name: "",
        team_logo_file: null,
        company_phone: "",
        company_email:"",
        company_address:"",
        smtp_host:"",
        smtp_port:"587",
        smtp_email:"",
        smtp_password:"",
        smtp_from_name:"",
    })

    const set = (key: keyof FormData) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
          setForm((f) => ({ ...f, [key]: e.target.value }))

    const handleLogoChange= (e:React.ChangeEvent<HTMLInputElement>)=>{
        const file= e.target.files?.[0]
        if(!file)return
        setForm((f)=>({...f, team_logo_file: file}))
        setLogoPreview(URL.createObjectURL(file))
    }

    const removeLogo= ()=>{
        setForm((f)=>({...f, team_logo_file: null}))
        setLogoPreview(null)
        if(fileInputRef.current) fileInputRef.current.value=""
    }

    const next= ()=>{
        setError(null)
        //step 1 validation
        if(step===1 && !form.full_name.trim()){
            setError("Please enter your company name.")
            return
        }
        //step 2 validation
        if(step===2 && !form.team_name.trim()){
            setError("Please enter your company name.")
            return
        }
        setStep((s)=>Math.min(s+1, STEPS.length))
    }
    
    const prev=()=>{
        setError(null)
        setStep((s)=>Math.max(s-1, 1))
    }

    const handleSubmit= ()=>{
        setError(null)
        startTransition(async ()=>{
            try{
                let team_logo_url: string | undefined

                //upload logo if provided
                if(form.team_logo_file){
                    const fd= new FormData()
                    fd.append("file", form.team_logo_file)
                    const result= await uploadTeamLogo(fd)
                    if("error" in result){
                        setError(result.error ?? "Logo upload failed")
                        return
                    }
                    team_logo_url= result.url
                }

                //build payload
                const payload: ProfilePayload= {
                    full_name: form.full_name.trim() || null,
                    team_name: form.team_name.trim() || null,
                    team_logo_url: team_logo_url ?? null,
                    company_phone: form.company_phone.trim() || null,
                    company_email: form.company_email.trim() || null,
                    company_address: form.company_address.trim() || null,
                    //SMTP
                    ...(form.smtp_host.trim()
                ?{
                    smtp_host: form.smtp_host.trim(),
                    smtp_port: form.smtp_port? Number(form.smtp_port): 587,
                    smtp_email: form.smtp_email.trim()||null,
                    smtp_password: form.smtp_password.trim()||null,
                    smtp_from_name: form.smtp_from_name.trim() || null,
                }
            :{})
                }
                const result= await upsertProfile(payload)
                if(result && "error" in result){
                    setError(result.error ?? "Something went wrong.")
                    return
                }
                router.push("/dashboard")
            }catch{
                setError("An unexpected error occured. Please try again")
            }
        })
    }

    const currentStep = STEPS[step - 1]
    const StepIcon = currentStep.icon

    return(
        <div className={cn("flex flex-col gap-6 w-full max-w-lg mx-auto", className)} {...props}>
            {/* Header */}
            <div className="flex items-center justify-center gap-2">
                <Image src="/logo.png" alt="Landscaping" width={36} height={36} className="size-9 object-contain" priority/>
                <span className="text-base font-medium text-foreground/90">Landscaping</span>
            </div>

            <Card  className="overflow-hidden p-0 shadow-md">
                <CardContent className="p-0">
                    {/* Progress bar */}
                    <div className="flex border-b">
                        {STEPS.map((s)=>{
                            const Icon= s.icon
                            const isActive= s.id === step
                            const isDone= s.id< step
                            return (
                                <div
                                key={s.id}
                                className={cn(
                                    "flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors text-xs font-medium border-b-2 -mb-px",
                                    isActive
                                    ? "border-primary text-primary"
                                    : isDone
                                    ? "border-pirmary/40 text-primary/60"
                                    : "border-transparent text-muted-foreground"
                                )}
                                >
                                <div  className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                                    isActive ? "bg-primary text-primary-foreground": isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                )}
                                >
                                    {isDone ? <Check className="h-3.5 w-3.5"/> : <Icon className="h-3.5 w-3.5" />}
                                </div>
                                <span  className="hidden sm:block">{s.label}</span>
                                </div>
                            )
                        })}
                    </div>
                    
                    {/* Form body */}
                    <div className="p-6 md:p-8">
                        <div className="mb-6 flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <StepIcon className="h-5 w-5 text-primary"/>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold leading-tight">{currentStep.title}</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">{currentStep.subtitle}</p>
                            </div>
                        </div>

                        <FieldGroup>
                            {/* Personal */}
                            {step===1 && (
                                 <Field>
                                 <FieldLabel htmlFor="full_name">Full Name <span className="text-red-500">*</span></FieldLabel>
                                 <Input
                                   id="full_name"
                                   name="full_name"
                                   type="text"
                                   placeholder="John Smith"
                                   value={form.full_name}
                                   onChange={set("full_name")}
                                   required
                                   autoFocus
                                 />
                                 <FieldDescription>Your name as it will appear on invoices and documents.</FieldDescription>
                               </Field>
                            )}

                            {/* Company */}
                            {step===2 &&(
                                <>
                                <Field>
                                    <FieldLabel htmlFor="team_name">Company Name <span className="text-red-500">*</span> </FieldLabel>
                                    <Input
                                        id="team_name"
                                        name="team_name"
                                        type="text"
                                        placeholder="Green Vally Landscaping"
                                        value={form.team_name}
                                        onChange={set("team_name")}
                                        required
                                        autoFocus
                                    />
                                </Field>

                                {/* Logo upload */}
                                <Field>
                                    <FieldLabel>Company Logo <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
                                    <div className="flex items-center gap-3">
                                        {logoPreview ? (
                                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg obrder bg-muted">
                                                <Image  src={logoPreview} alt="Logo preview" fill className="object-cover"/>
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
                                                >
                                                    <X className="h-3 w-3"/>
                                                </button>
                                            </div>
                                        ): (
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-muted-foreground">
                                                <Upload  className="h-5 w-5"/>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            {logoPreview ? "Change logo" : "Upload logo"}
                                            </Button>
                                            <span className="text-xs text-muted-foreground">PNG or JPG, max 2 MB</span>
                                        </div>
                                    </div>
                                    <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel  htmlFor="company_phone">Phone Number</FieldLabel>
                                    <Input
                                    id="company_phone"
                                    name="company_phone"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    value={form.company_phone}
                                    onChange={set("company_phone")}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="company_email">Company Email</FieldLabel>
                                    <Input
                                    id="company_email"
                                    name="company_email"
                                    type="email"
                                    placeholder="hello@yourcompany.com"
                                    value={form.company_email}
                                    onChange={set("company_email")}
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="company_address">Address</FieldLabel>
                                    <Input
                                    id="company_address"
                                    name="company_address"
                                    type="text"
                                    placeholder="123 Main St, Springfield, IL 62701"
                                    value={form.company_address}
                                    onChange={set("company_address")}
                                    />
                                </Field>
                                </>
                            )}

                            {/* SMTP */}
                            {step===3 &&(
                                <>
                                    <div className="rounded-lg border bg-muted/40 px-4 py-3 text-muted-foreground">
                                        Configure your own SMTP server to send emails from your company address. You can skip this and set it up later in settings
                                    </div>

                                    <Field>
                                        <FieldLabel htmlFor="smtp_host">SMTP Host</FieldLabel>
                                        <Input
                                        id="smtp_host"
                                        name="smtp_host"
                                        type="text"
                                        placeholder="smtp.gmail.com"
                                        value={form.smtp_host}
                                        onChange={set("smtp_host")}
                                        />
                                    </Field>

                                    <div className="grid grid-cols-3 gap-4">
                                        <Field className="col-span-2">
                                            <FieldLabel htmlFor="smtp_email">SMTP Mail</FieldLabel>
                                            <Input
                                            id="smtp_email"
                                            name="smtp_email"
                                            type="email"
                                            placeholder="you@gmail.com"
                                            value={form.smtp_email}
                                            onChange={set("smtp_email")}
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="smtp_port">Port</FieldLabel>
                                            <Input
                                            id="smtp_port"
                                            name="smtp_port"
                                            type="number"
                                            placeholder="587"
                                            value={form.smtp_port}
                                            onChange={set("smtp_port")}
                                            />
                                        </Field>
                                    </div>

                                    <Field>
                                        <FieldLabel htmlFor="smtp_password">SMTP Password / App Password</FieldLabel>
                                        <Input
                                        id="smtp_password"
                                        name="smtp_password"
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={form.smtp_password}
                                        onChange={set("smtp_password")}
                                        />
                                        <FieldDescription>Use an app-specific password if you have 2FA enabled</FieldDescription>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="smtp_from_name">From Name</FieldLabel>
                                        <Input
                                        id="smtp_from_name"
                                        name="smtp_from_name"
                                        type="text"
                                        placeholder="Green Valley Landscaping"
                                        value={form.smtp_from_name}
                                        onChange={set("smtp_from_name")}
                                        />
                                        <FieldDescription>The sender name shown in the recipient&apos;s inbox.</FieldDescription>
                                    </Field>
                                </>
                            )}

                            {/* Error */}
                            {error && <p className="text-sm text-red-500">{error}</p>}

                            {/* Navigation */}
                            <div className={cn("flex gap-3 pt-2", step>1 ? "justify-between": "justify-end")}>
                                {step> 1 && (
                                    <Button type="button" variant="outline" onClick={prev} disabled={isPending}>
                                        <ChevronLeft className="mr-1 h-4 w-4"/>
                                        Back
                                    </Button>
                                )}

                                {step< STEPS.length ? (
                                    <Button type="button" onClick={next}>
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4"/>
                                    </Button>
                                ):(
                                    <div className="flex gap-2">
                                        {step=== STEPS.length &&(
                                            <Button
                                            type="button"
                                            variant="ghost"
                                            disabled={isPending}
                                            onClick={()=>{
                                                setForm((f)=>({
                                                    ...f, smtp_host:"",smtp_email:"",smtp_password:"", smtp_from_name:""
                                                }))
                                                handleSubmit()
                                            }}
                                            >
                                                Skip &amp; finish
                                            </Button>
                                        )}
                                        <Button type="button" onClick={handleSubmit} disabled={isPending}>
                                            {isPending ? "Saving...":"Save & go to dashboard"}
                                            {!isPending && <Check className="ml-1 h-4 w-4"/>}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </FieldGroup>
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center text-xs">
                You can always update this information later from your{" "}
                <Link href="/dashboard/settings" className="underline underline-offset-2">
                Settings
                </Link>{" "}
                page.
            </FieldDescription>
        </div>
    )

    
}