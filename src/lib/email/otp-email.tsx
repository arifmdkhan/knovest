import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
    Link,
} from "@react-email/components";
import * as React from "react";

interface OtpEmailProps {
    otp: string;
}

export const OtpEmail = ({ otp }: OtpEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Your verification code for Consensus</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Verify your email address</Heading>
                    <Text style={text}>
                       Please Verify using below code to proceed.
                    </Text>
                    <Section style={codeContainer}>
                        <Text style={code}>{otp}</Text>
                    </Section>
                    <Text style={text}>
                        This code is valid for 10 minutes.
                    </Text>
                    <Hr style={hr} />
                    <Link href="https://consensus.app" style={reportLink}>
                        Consensus
                    </Link>
                </Container>
            </Body>
        </Html>
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
    fontWeight: "bold",
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
