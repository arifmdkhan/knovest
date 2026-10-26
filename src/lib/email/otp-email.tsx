

interface OtpEmailProps {
    otp: string;
}

const OtpEmail = ({ otp }: OtpEmailProps) => {
    return (
        <html>
            <head />
            <body style={main}>
                <span style={{ display: "none" }}>Your verification code for Knovest</span>
                <div style={container}>
                    <h1 style={h1}>Verify your email address</h1>
                    <p style={text}>
                       Use this code to continue to Knovest.
                    </p>
                    <div style={codeContainer}>
                        <p style={code}>{otp}</p>
                    </div>
                    <p style={text}>
                        This code is valid for 10 minutes.
                    </p>
                    <hr style={hr} />
                    <a href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"} style={reportLink}>
                        Knovest
                    </a>
                </div>
            </body>
        </html>
    );
};

export default OtpEmail;

const main = {
    backgroundColor: "#ffffff",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "560px",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "bold" as const,
    margin: "40px 0",
    padding: "0",
    color: "#333",
};

const text = {
    color: "#333",
    fontSize: "16px",
    lineHeight: "26px",
};

const codeContainer = {
    background: "rgba(0,0,0,0.05)",
    borderRadius: "4px",
    margin: "16px 0",
    verticalAlign: "middle",
    width: "280px",
};

const code = {
    color: "#000",
    display: "inline-block",
    fontFamily: "monospace",
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "6px",
    lineHeight: "40px",
    paddingBottom: "8px",
    paddingTop: "8px",
    margin: "0 auto",
    width: "100%",
    textAlign: "center" as const,
};

const hr = {
    borderColor: "#cccccc",
    margin: "20px 0",
};

const reportLink = {
    fontSize: "14px",
    color: "#b4becc",
};
