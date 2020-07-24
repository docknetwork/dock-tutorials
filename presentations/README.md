# Creating verifiable presentations
The Dock SDK exposes a `VerifiablePresentation` class that is useful to incrementally create valid Verifiable Presentations of any type, sign them and verify them. Once the presentation is initialized, you can sequentially call the different methods provided by the class to add `contexts`, `types`, `holders` and `credentials`. In this tutorial we will be building off of the code for creating, signing and verifying Verifiable Credentials. It assumes knowledge learned from there.

The first step to build a Verifiable Presentation is to initialize it, we can do that using the `VerifiablePresentation` class constructor which takes an `id` as sole argument:
```javascript
import VerifiablePresentation from '@docknetwork/sdk/verifiable-presentation';
const vp = new VerifiablePresentation('http://example.edu/credentials/1986');
```

This Presentation isn't signed since we only just initialized it. It brings however some useful defaults to make your life easier.
```javascript
>    vp.context
<-   ["https://www.w3.org/2018/credentials/v1"]
>    vp.type
<-   ["VerifiablePresentation"]
>    vp.credentials
<-   []
```

The default `context` is an array with `"https://www.w3.org/2018/credentials/v1"` as first element. This is required by the VCDMv1 specs so having it as default helps ensure your Verifiable Presentations will be valid in the end.
A similar approach was taken on the `type` property, where the default is an array with `"VerifiablePresentation"` already populated. This is also required by the specs.
The `credentials` property is required to exist, so this is already initialized for you as well although it is empty for now.

We could also have checked those defaults more easily by checking the Verifiable Presentation's JSON representation. This can be achieved by calling the `toJSON()` method on it:
```javascript
>    vp.toJSON()
<-   {
       "@context": [ "https://www.w3.org/2018/credentials/v1" ],
       "id": "http://example.edu/credentials/1986",
       "type": [
         "VerifiablePresentation"
       ],
       "verifiableCredential": [],
     }
```

Once your Verifiable Presentation has been initialized, you can proceed to use the rest of the building functions to define it completely before finally signing it.

#### Adding a Context
A context can be added with the `addContext` method. It accepts a single argument `context` which can either be a string (in which case it needs to be a valid URI), or an object
```javascript
>   vp.addContext('https://www.w3.org/2018/credentials/examples/v1')
>   vp.context
<-  [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1'
    ])
```

#### Adding a Type
A type can be added with the `addType` function. It accepts a single argument `type` that needs to be a string:
```javascript
>   vp.addType('CredentialManagerPresentation')
>   vp.type
<-  [
      'VerifiablePresentation',
      'CredentialManagerPresentation'
    ]
```

#### Setting a Holder
Setting a Holder is optional and it can be achieved using the `setHolder` method. It accepts a single argument `type` that needs to be a string (a URI for the entity that is generating the presentation):
```javascript
>   vp.setHolder('https://example.com/credentials/1234567890');
>   vp.holder
<-  'https://example.com/credentials/1234567890'
```

#### Adding a Verifiable Credential
Your Verifiable Presentations can contain one or more Verifiable Credentials inside.
Adding a Verifiable Credential can be achieved using the `addCredential` method. It accepts a single argument `credential` that needs to be an object (a valid, signed Verifiable Credential):
```javascript
>   vp.addCredential(vc);
>   vp.credentials
<-  [
      {...}
    ]
```

TODO: show in steps of just building, to signing and then to verifying
