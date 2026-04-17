import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { ImmichButton } from 'src/emails/components/button.component';
import ImmichLayout from 'src/emails/components/immich.layout';
import { WelcomeEmailProps } from 'src/repositories/email.repository';
import { replaceTemplateTags } from 'src/utils/replace-template-tags';

export const WelcomeEmail = ({ baseUrl, displayName, username, registrationUrl, customTemplate }: WelcomeEmailProps) => {
  const usableTemplateVariables = {
    displayName,
    username,
    registrationUrl,
    baseUrl,
  };

  const emailContent = customTemplate ? (
    replaceTemplateTags(customTemplate, usableTemplateVariables)
  ) : (
    <>
      <Text className="m-0">
        Hey <strong>{displayName}</strong>!
      </Text>

      <Text>You have been invited to PrivoHub Photos. Click the button below to create your account and get started.</Text>

      <Text>
        <strong>Email</strong>: {username}
      </Text>
    </>
  );

  return (
    <ImmichLayout preview={customTemplate ? emailContent.toString() : `You've been invited to PrivoHub Photos.`}>
      {customTemplate && (
        <Text className="m-0">
          <div dangerouslySetInnerHTML={{ __html: emailContent }}></div>
        </Text>
      )}

      {!customTemplate && emailContent}

      <Section className="flex justify-center my-6">
        <ImmichButton href={registrationUrl}>Create Account</ImmichButton>
      </Section>

      <Text className="text-xs">
        If you cannot click the button, use the link below to create your account.
        <br />
        <Link href={registrationUrl}>{registrationUrl}</Link>
      </Text>
    </ImmichLayout>
  );
};

WelcomeEmail.PreviewProps = {
  baseUrl: 'https://photos-demo.privohub.com',
  displayName: 'Alan Turing',
  username: 'alanturing@example.com',
  registrationUrl: 'https://auth.privohub.com/realms/privohub/protocol/openid-connect/registrations?client_id=immich-demo&response_type=code&redirect_uri=https://photos-demo.privohub.com',
} as WelcomeEmailProps;

export default WelcomeEmail;
