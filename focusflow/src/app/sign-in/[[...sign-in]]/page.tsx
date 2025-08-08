import { SignIn } from "@clerk/nextjs";
 
export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-slate-800 border border-slate-700",
            headerTitle: "text-white",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton: "bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
            dividerLine: "bg-slate-700",
            dividerText: "text-slate-400",
            formFieldLabel: "text-slate-300",
            formFieldInput: "bg-slate-700 border-slate-600 text-white",
            formButtonPrimary: "bg-purple-500 hover:bg-purple-600",
            footerActionLink: "text-purple-400 hover:text-purple-300",
            identityPreviewText: "text-white",
            identityPreviewEditButton: "text-purple-400 hover:text-purple-300",
          },
        }}
      />
    </div>
  );
}


